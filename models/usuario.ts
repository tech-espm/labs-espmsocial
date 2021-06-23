import { randomBytes } from "crypto";
import express = require("express");
// https://www.npmjs.com/package/lru-cache
import lru = require("lru-cache");
import Sql = require("../infra/sql");
import GeradorHash = require("../utils/geradorHash");
import appsettings = require("../appsettings");
import intToHex = require("../utils/intToHex");
import Cargo = require("./cargo");
import FS = require("../infra/fs");
import Upload = require("../infra/upload");
import DataUtil = require("../utils/dataUtil");
import emailValido = require("../utils/emailValido");

export = class Usuario {

	private static readonly IdAdmin = 1;

	public static readonly CaminhoRelativoPerfil = "public/imagens/perfil/";

	public id: number;
	public login: string;
	public nome: string;
	public idcargovigente: number;
	public idequipevigente: number;
	public idcurso: number;
	public idgenero: number;
	public idcargo1: number;
	public idcargo2: number;
	public idcargo3: number;
	public idcargo4: number;
	public idcargo5: number;
	public idequipe1: number;
	public idequipe2: number;
	public idequipe3: number;
	public idequipe4: number;
	public idequipe5: number;
	public cargodata1: string;
	public cargodata2: string;
	public cargodata3: string;
	public cargodata4: string;
	public cargodata5: string;
	public versao: number;
	public senha: string;
	public email: string;
	public telefone: string;
	public whatsapp: string;
	public instagram: string;
	public facebook: string;
	public linkedin: string;
	public observacoes: string;
	public periodo_entrada: string;
	public periodo_saida: string;
	public data_entrada: string;
	public data_saida: string;
	public semestre_entrada: number;
	public semestre_saida: number;
	public semestre_atual: number;
	public semestre_permanencia: number;
	public colegiado: number;
	public ativo: number;
	public criacao: string;

	// Utilizados apenas através do cookie
	public admin: boolean;
	public gestor: boolean;

	// Não estamos utilizando Usuario.cookie como middleware, porque existem muitas requests
	// que não precisam validar o usuário logado, e agora, é assíncrono...
	// http://expressjs.com/pt-br/guide/writing-middleware.html
	//public static cookie(req: express.Request, res: express.Response, next: Function): void {
	public static async cookie(req: express.Request, res: express.Response = null, admin: boolean = false, gestor: boolean = false): Promise<Usuario> {
		let cookieStr = req.cookies[appsettings.cookie] as string;
		if (!cookieStr || cookieStr.length !== 48) {
			if (res) {
				res.statusCode = 403;
				res.json("Não permitido");
			}
			return null;
		} else {
			let id = parseInt(cookieStr.substr(0, 8), 16) ^ appsettings.usuarioHashId;
			let usuario: Usuario = null;

			await Sql.conectar(async (sql: Sql) => {
				let rows = await sql.query("select id, login, nome, idcargovigente, versao, token from usuario where id = ? and ativo = 1", [id]);
				let row: any;

				if (!rows || !rows.length || !(row = rows[0]))
					return;

				let token = cookieStr.substring(16);

				if (!row.token || token !== (row.token as string))
					return;

				let u = new Usuario();
				u.id = id;
				u.login = row.login as string;
				u.nome = row.nome as string;
				u.idcargovigente = row.idcargovigente as number;
				u.versao = row.versao as number;
				u.admin = (u.idcargovigente === Cargo.IdCoordenadorDocente);
				u.gestor = (u.idcargovigente === Cargo.IdGestorEquipe);

				usuario = u;
			});

			if (admin && usuario && !usuario.admin)
				usuario = null;

			if (gestor && usuario && !usuario.admin && !usuario.gestor)
				usuario = null;

			if (!usuario && res) {
				res.statusCode = 403;
				res.json("Não permitido");
			}
			return usuario;
		}
	}

	private static gerarTokenCookie(id: number): [string, string] {
		let idStr = intToHex(id ^ appsettings.usuarioHashId);
		let idExtra = intToHex(0);
		let token = randomBytes(16).toString("hex");
		let cookieStr = idStr + idExtra + token;
		return [token, cookieStr];
	}

	public static async efetuarLogin(login: string, senha: string, res: express.Response): Promise<[string, Usuario]> {
		if (!login || !senha)
			return ["Usuário ou senha inválidos", null];

		let r: string = null;
		let u: Usuario = null;

		await Sql.conectar(async (sql: Sql) => {
			login = login.normalize().trim().toLowerCase();

			let rows = await sql.query("select id, nome, idcargovigente, versao, senha from usuario where login = ? and ativo = 1", [login]);
			let row: any;
			let ok: boolean;

			if (!rows || !rows.length || !(row = rows[0]) || !(ok = await GeradorHash.validarSenha(senha.normalize(), row.senha))) {
				r = "Usuário ou senha inválidos";
				return;
			}

			let [token, cookieStr] = Usuario.gerarTokenCookie(row.id);

			await sql.query("update usuario set token = ? where id = ?", [token, row.id]);

			u = new Usuario();
			u.id = row.id;
			u.login = login;
			u.nome = row.nome as string;
			u.idcargovigente = row.idcargovigente as number;
			u.versao = row.versao as number;
			u.admin = (u.idcargovigente === Cargo.IdCoordenadorDocente);
			u.gestor = (u.idcargovigente === Cargo.IdGestorEquipe);

			res.cookie(appsettings.cookie, cookieStr, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: "/", secure: appsettings.cookieSecure });
		});

		return [r, u];
	}

	public async efetuarLogout(res: express.Response): Promise<void> {
		await Sql.conectar(async (sql: Sql) => {
			await sql.query("update usuario set token = null where id = ?", [this.id]);

			res.cookie(appsettings.cookie, "", { expires: new Date(0), httpOnly: true, path: "/", secure: appsettings.cookieSecure });
		});
	}

	public async alterarPerfil(res: express.Response, nome: string, senhaAtual: string, novaSenha: string, imagemPerfil: string): Promise<string> {
		nome = (nome || "").normalize().trim();
		if (nome.length < 3 || nome.length > 100)
			return "Nome inválido";

		if (!!senhaAtual !== !!novaSenha || (novaSenha && novaSenha.length > 40))
			return "Senha inválida";

		let r: string = null;

		await Sql.conectar(async (sql: Sql) => {
			if (senhaAtual) {
				let hash = await sql.scalar("select senha from usuario where id = ?", [this.id]) as string;
				if (!await GeradorHash.validarSenha(senhaAtual.normalize(), hash)) {
					r = "Senha atual não confere";
					return;
				}

				hash = await GeradorHash.criarHash(novaSenha.normalize());

				let [token, cookieStr] = Usuario.gerarTokenCookie(this.id);

				await sql.query("update usuario set nome = ?, senha = ?, token = ? where id = ?", [nome, hash, token, this.id]);

				this.nome = nome;

				res.cookie(appsettings.cookie, cookieStr, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: "/", secure: appsettings.cookieSecure });
			} else {
				await sql.query("update usuario set nome = ? where id = ?", [nome, this.id]);

				this.nome = nome;
			}

			if (imagemPerfil) {
				if (!imagemPerfil.startsWith("data:image/jpeg;base64,") || imagemPerfil.length === 23) {
					r = (senhaAtual ? "A senha foi alterada com sucesso, mas a imagem de perfil é inválida" : "Imagem de perfil inválida");
					return;
				}

				if (imagemPerfil.length > (23 + (256 * 1024 * 4 / 3))) {
					r = (senhaAtual ? "A senha foi alterada com sucesso, mas a imagem de perfil é muito grande" : "Imagem de perfil muito grande");
					return;
				}

				try {
					await Upload.gravarArquivo({
						buffer: Buffer.from(imagemPerfil.substr(23), "base64")
					}, Usuario.CaminhoRelativoPerfil, this.id + ".jpg");

					this.versao++;

					await sql.query("update usuario set versao = ? where id = ?", [this.versao, this.id]);
				} catch (ex) {
					r = (senhaAtual ? "A senha foi alterada com sucesso, mas ocorreu um erro ao gravar a imagem de perfil" : "Erro ao gravar a imagem de perfil");
					return;
				}
			}
		});

		return r;
	}

	private static validar(u: Usuario): string {
		u.nome = (u.nome || "").normalize().trim();
		if (u.nome.length < 2 || u.nome.length > 100)
			return "Nome inválido";

		u.idcargovigente = parseInt(u.idcargovigente as any);
		if (isNaN(u.idcargovigente))
			return "Cargo vigente inválido";

		if (!u.idequipevigente)
			u.idequipevigente = null;
		else if (isNaN(u.idequipevigente = parseInt(u.idequipevigente as any)))
			return "Equipe vigente inválida";

		u.idcurso = parseInt(u.idcurso as any);
		if (isNaN(u.idcurso))
			return "Curso inválido";

		u.idgenero = parseInt(u.idgenero as any);
		if (isNaN(u.idgenero))
			return "Gênero inválido";

		if (!u.idcargo1)
			u.idcargo1 = null;
		else if (isNaN(u.idcargo1 = parseInt(u.idcargo1 as any)))
			return "Cargo inválido";

		if (!u.idcargo2)
			u.idcargo2 = null;
		else if (isNaN(u.idcargo2 = parseInt(u.idcargo2 as any)))
			return "Cargo inválido";

		if (!u.idcargo3)
			u.idcargo3 = null;
		else if (isNaN(u.idcargo3 = parseInt(u.idcargo3 as any)))
			return "Cargo inválido";

		if (!u.idcargo4)
			u.idcargo4 = null;
		else if (isNaN(u.idcargo4 = parseInt(u.idcargo4 as any)))
			return "Cargo inválido";

		if (!u.idcargo5)
			u.idcargo5 = null;
		else if (isNaN(u.idcargo5 = parseInt(u.idcargo5 as any)))
			return "Cargo inválido";

		if (!u.idequipe1)
			u.idequipe1 = null;
		else if (isNaN(u.idequipe1 = parseInt(u.idequipe1 as any)))
			return "Equipe inválida";

		if (!u.idequipe2)
			u.idequipe2 = null;
		else if (isNaN(u.idequipe2 = parseInt(u.idequipe2 as any)))
			return "Equipe inválida";

		if (!u.idequipe3)
			u.idequipe3 = null;
		else if (isNaN(u.idequipe3 = parseInt(u.idequipe3 as any)))
			return "Equipe inválida";

		if (!u.idequipe4)
			u.idequipe4 = null;
		else if (isNaN(u.idequipe4 = parseInt(u.idequipe4 as any)))
			return "Equipe inválida";

		if (!u.idequipe5)
			u.idequipe5 = null;
		else if (isNaN(u.idequipe5 = parseInt(u.idequipe5 as any)))
			return "Equipe inválida";

		if (!u.cargodata1)
			u.cargodata1 = null;
		else if (!(u.cargodata1 = DataUtil.converterDataISO(u.cargodata1.normalize().trim())))
			return "Data do cargo inválida";

		if (!u.cargodata2)
			u.cargodata2 = null;
		else if (!(u.cargodata2 = DataUtil.converterDataISO(u.cargodata2.normalize().trim())))
			return "Data do cargo inválida";

		if (!u.cargodata3)
			u.cargodata3 = null;
		else if (!(u.cargodata3 = DataUtil.converterDataISO(u.cargodata3.normalize().trim())))
			return "Data do cargo inválida";

		if (!u.cargodata4)
			u.cargodata4 = null;
		else if (!(u.cargodata4 = DataUtil.converterDataISO(u.cargodata4.normalize().trim())))
			return "Data do cargo inválida";

		if (!u.cargodata5)
			u.cargodata5 = null;
		else if (!(u.cargodata5 = DataUtil.converterDataISO(u.cargodata5.normalize().trim())))
			return "Data do cargo inválida";

		u.email = (u.email || "").normalize().trim().toLowerCase();
		if (u.email) {
			if (!emailValido(u.email) || u.email.length > 100)
				return "E-mail inválido";
		} else {
			u.email = null;
		}

		u.telefone = (u.telefone || "").normalize().trim();
		if (u.telefone) {
			if (u.telefone.length < 3 || u.telefone.length > 20)
				return "Telefone inválido";
		} else {
			u.telefone = null;
		}

		u.whatsapp = (u.whatsapp || "").normalize().trim();
		if (u.whatsapp) {
			if (u.whatsapp.length < 3 || u.whatsapp.length > 20)
				return "WhatsApp inválido";
		} else {
			u.whatsapp = null;
		}

		u.instagram = (u.instagram || "").normalize().trim();
		if (u.instagram) {
			if (u.instagram.length < 3 || u.instagram.length > 100)
				return "Instagram inválido";
		} else {
			u.instagram = null;
		}

		u.facebook = (u.facebook || "").normalize().trim();
		if (u.facebook) {
			if (u.facebook.length < 3 || u.facebook.length > 100)
				return "Facebook inválido";
		} else {
			u.facebook = null;
		}

		u.linkedin = (u.linkedin || "").normalize().trim();
		if (u.linkedin) {
			if (u.linkedin.length < 3 || u.linkedin.length > 100)
				return "LinkedIn inválido";
		} else {
			u.linkedin = null;
		}

		u.observacoes = (u.observacoes || "").normalize().trim();
		if (u.observacoes) {
			if (u.observacoes.length > 100)
				return "Observações inválidas";
		} else {
			u.observacoes = null;
		}

		u.periodo_entrada = (u.periodo_entrada || "").normalize().trim();
		if (u.periodo_entrada) {
			if (u.periodo_entrada.length > 20)
				return "Período de entrada inválido";
		} else {
			u.periodo_entrada = null;
		}

		u.periodo_saida = (u.periodo_saida || "").normalize().trim();
		if (u.periodo_saida) {
			if (u.periodo_saida.length > 20)
				return "Período de saída inválido";
		} else {
			u.periodo_saida = null;
		}

		if (!u.data_entrada)
			u.data_entrada = null;
		else if (!(u.data_entrada = DataUtil.converterDataISO(u.data_entrada.normalize().trim())))
			return "Data de entrada inválida";

		if (!u.data_saida)
			u.data_saida = null;
		else if (!(u.data_saida = DataUtil.converterDataISO(u.data_saida.normalize().trim())))
			return "Data de saída inválida";

		if (!u.semestre_entrada) {
			u.semestre_entrada = null;
		} else {
			u.semestre_entrada = parseInt(u.semestre_entrada as any);
			if (isNaN(u.semestre_entrada) || u.semestre_entrada > 12)
				return "Semestre de entrada inválido";
		}

		if (!u.semestre_saida) {
			u.semestre_saida = null;
		} else {
			u.semestre_saida = parseInt(u.semestre_saida as any);
			if (isNaN(u.semestre_saida) || u.semestre_saida > 12)
				return "Semestre de saída inválido";
		}

		if (!u.semestre_atual) {
			u.semestre_atual = null;
		} else {
			u.semestre_atual = parseInt(u.semestre_atual as any);
			if (isNaN(u.semestre_atual) || u.semestre_atual > 12)
				return "Semestre atual inválido";
		}

		if (!u.semestre_permanencia) {
			u.semestre_permanencia = null;
		} else {
			u.semestre_permanencia = parseInt(u.semestre_permanencia as any);
			if (isNaN(u.semestre_permanencia))
				return "Permanência inválida";
		}

		u.colegiado = (parseInt(u.colegiado as any) ? 1 : 0);

		u.ativo = (parseInt(u.ativo as any) ? 1 : 0);

		return null;
	}

	public static async listar(colegiado: boolean): Promise<Usuario[]> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query(`
			select
			u.id, u.login, u.nome,
			cv.nome cargovigente, ev.nome equipevigente,
			c.nome curso, g.nome genero,
			c1.nome cargo1, c2.nome cargo2, c3.nome cargo3, c4.nome cargo4, c5.nome cargo5,
			e1.nome equipe1, e2.nome equipe2, e3.nome equipe3, e4.nome equipe4, e5.nome equipe5,
			date_format(u.cargodata1, '%d/%m/%Y') cargodata1, date_format(u.cargodata2, '%d/%m/%Y') cargodata2, date_format(u.cargodata3, '%d/%m/%Y') cargodata3, date_format(u.cargodata4, '%d/%m/%Y') cargodata4, date_format(u.cargodata5, '%d/%m/%Y') cargodata5,
			u.versao, u.email, u.telefone, u.whatsapp, u.instagram, u.facebook, u.linkedin, u.observacoes, u.periodo_entrada, u.periodo_saida,
			date_format(u.data_entrada, '%d/%m/%Y') data_entrada, date_format(u.data_saida, '%d/%m/%Y') data_saida,
			u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.semestre_permanencia, u.colegiado, u.ativo, date_format(u.criacao, '%d/%m/%Y') criacao
			from usuario u
			inner join cargo cv on (cv.id = u.idcargovigente)
			inner join curso c on (c.id = u.idcurso)
			inner join genero g on (g.id = u.idgenero)
			left join equipe ev on (ev.id = u.idequipevigente)
			left join cargo c1 on (c1.id = u.idcargo1)
			left join cargo c2 on (c2.id = u.idcargo2)
			left join cargo c3 on (c3.id = u.idcargo3)
			left join cargo c4 on (c4.id = u.idcargo4)
			left join cargo c5 on (c5.id = u.idcargo5)
			left join equipe e1 on (e1.id = u.idequipe1)
			left join equipe e2 on (e2.id = u.idequipe2)
			left join equipe e3 on (e3.id = u.idequipe3)
			left join equipe e4 on (e4.id = u.idequipe4)
			left join equipe e5 on (e5.id = u.idequipe5)
			where colegiado = ${(colegiado ? 1 : 0)}
			`) as Usuario[];
		});

		return (lista || []);
	}

	public static async obter(id: number): Promise<Usuario> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query(`
			select
			id,
			login,
			nome,
			idcargovigente,
  			idequipevigente,
			idcurso,
			idgenero,
			idcargo1,
			idcargo2,
			idcargo3,
			idcargo4,
			idcargo5,
			idequipe1,
			idequipe2,
			idequipe3,
			idequipe4,
			idequipe5,
			date_format(cargodata1, '%Y-%m-%d') cargodata1,
			date_format(cargodata2, '%Y-%m-%d') cargodata2,
			date_format(cargodata3, '%Y-%m-%d') cargodata3,
			date_format(cargodata4, '%Y-%m-%d') cargodata4,
			date_format(cargodata5, '%Y-%m-%d') cargodata5,
			versao,
			senha,
			token,
			email,
			telefone,
			whatsapp,
			instagram,
			facebook,
			linkedin,
			observacoes,
			periodo_entrada,
			periodo_saida,
			date_format(data_entrada, '%Y-%m-%d') data_entrada,
			date_format(data_saida, '%Y-%m-%d') data_saida,
			semestre_entrada,
			semestre_saida,
			semestre_atual,
			semestre_permanencia,
			colegiado,
			ativo
			from usuario where id = ?`, [id]) as Usuario[];
		});

		return ((lista && lista[0]) || null);
	}

	public static async criar(u: Usuario): Promise<string> {
		let res: string;
		if ((res = Usuario.validar(u)))
			return res;

		u.login = (u.login || "").normalize().trim().toLowerCase();
		if (u.login.length < 3 || u.login.length > 100)
			return "Login inválido";

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("insert into usuario (login, nome, idcargovigente, idequipevigente, idcurso, idgenero, idcargo1, idcargo2, idcargo3, idcargo4, idcargo5, idequipe1, idequipe2, idequipe3, idequipe4, idequipe5, cargodata1, cargodata2, cargodata3, cargodata4, cargodata5, versao, senha, email, telefone, whatsapp, instagram, facebook, linkedin, observacoes, periodo_entrada, periodo_saida, data_entrada, data_saida, semestre_entrada, semestre_saida, semestre_atual, semestre_permanencia, colegiado, ativo, criacao) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [u.login, u.nome, u.idcargovigente, u.idequipevigente, u.idcurso, u.idgenero, u.idcargo1, u.idcargo2, u.idcargo3, u.idcargo4, u.idcargo5, u.idequipe1, u.idequipe2, u.idequipe3, u.idequipe4, u.idequipe5, u.cargodata1, u.cargodata2, u.cargodata3, u.cargodata4, u.cargodata5, appsettings.usuarioHashSenhaPadrao, u.email, u.telefone, u.whatsapp, u.instagram, u.facebook, u.linkedin, u.observacoes, u.periodo_entrada, u.periodo_saida, u.data_entrada, u.data_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.semestre_permanencia, u.colegiado, u.ativo, DataUtil.hojeISOComHorario()]);
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `O login ${u.login} já está em uso`;
							break;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Curso ou gênero não encontrado";
							break;
						default:
							throw e;
					}
				} else {
					throw e;
				}
			}
		});

		return res;
	}

	public static async alterar(u: Usuario): Promise<string> {
		let res: string;
		if ((res = Usuario.validar(u)))
			return res;

		if (u.id === Usuario.IdAdmin)
			return "Não é possível editar o usuário administrador principal";

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update usuario set nome = ?, idcargovigente = ?, idequipevigente = ?, idcurso = ?, idgenero = ?, idcargo1 = ?, idcargo2 = ?, idcargo3 = ?, idcargo4 = ?, idcargo5 = ?, idequipe1 = ?, idequipe2 = ?, idequipe3 = ?, idequipe4 = ?, idequipe5 = ?, cargodata1 = ?, cargodata2 = ?, cargodata3 = ?, cargodata4 = ?, cargodata5 = ?, email = ?, telefone = ?, whatsapp = ?, instagram = ?, facebook = ?, linkedin = ?, observacoes = ?, periodo_entrada = ?, periodo_saida = ?, data_entrada = ?, data_saida = ?, semestre_entrada = ?, semestre_saida = ?, semestre_atual = ?, semestre_permanencia = ?, colegiado = ?, ativo = ? where id = ?", [u.nome, u.idcargovigente, u.idequipevigente, u.idcurso, u.idgenero, u.idcargo1, u.idcargo2, u.idcargo3, u.idcargo4, u.idcargo5, u.idequipe1, u.idequipe2, u.idequipe3, u.idequipe4, u.idequipe5, u.cargodata1, u.cargodata2, u.cargodata3, u.cargodata4, u.cargodata5, u.email, u.telefone, u.whatsapp, u.instagram, u.facebook, u.linkedin, u.observacoes, u.periodo_entrada, u.periodo_saida, u.data_entrada, u.data_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.semestre_permanencia, u.colegiado, u.ativo, u.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `O login ${u.login} já está em uso`;
							break;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Curso ou gênero não encontrado";
							break;
						default:
							throw e;
					}
				} else {
					throw e;
				}
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		if (id === Usuario.IdAdmin)
			return "Não é possível excluir o usuário administrador principal";

		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			id = parseInt(id as any);
			await sql.query("delete from usuario where id = ?", [id]);
			if (sql.linhasAfetadas)
				FS.excluirArquivo(Usuario.CaminhoRelativoPerfil + id + ".jpg");
			else
				res = "Usuário não encontrado";
		});

		return res;
	}

	public static async redefinirSenha(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			let login = await sql.scalar("select login from usuario where id = ?", [id]) as string;
			if (!login) {
				res = "0";
			} else {
				await sql.query("update usuario set token = null, senha = ? where id = ?", [appsettings.usuarioHashSenhaPadrao, id]);
				res = sql.linhasAfetadas.toString();
			}
		});

		return res;
	}
}
