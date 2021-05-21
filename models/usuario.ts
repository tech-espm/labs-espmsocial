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

export = class Usuario {

	private static readonly IdAdmin = 1;

	public static readonly CaminhoRelativoPerfil = "public/imagens/perfil/";

	public id: number;
	public login: string;
	public nome: string;
	public idcargo: number;
	public idequipe: number;
	public versao: number;
	public senha: string;
	public criacao: string;
	public email: string;
	public telefone: string;
	public whatsapp: string;
	public rede_social: string;
	public curso: string;
	public periodo_entrada: string;
	public periodo_saida: string;
	public semestre_entrada: number;
	public semestre_saida: number;
	public semestre_atual: number;
	public ativo: number;

	// Utilizados apenas através do cookie
	public admin: boolean;

	// Não estamos utilizando Usuario.cookie como middleware, porque existem muitas requests
	// que não precisam validar o usuário logado, e agora, é assíncrono...
	// http://expressjs.com/pt-br/guide/writing-middleware.html
	//public static cookie(req: express.Request, res: express.Response, next: Function): void {
	public static async cookie(req: express.Request, res: express.Response = null, admin: boolean = false): Promise<Usuario> {
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
				let rows = await sql.query("select id, login, nome, idcargo, versao, token from usuario where id = ?", [id]);
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
				u.idcargo = row.idcargo as number;
				u.versao = row.versao as number;
				u.admin = (u.idcargo === Cargo.IdCoordenadorDocente);

				usuario = u;
			});

			if (admin && usuario && usuario.idcargo !== Cargo.IdCoordenadorDocente)
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

			let rows = await sql.query("select id, nome, idcargo, versao, senha from usuario where login = ?", [login]);
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
			u.idcargo = row.idcargo as number;
			u.versao = row.versao as number;
			u.admin = (u.idcargo === Cargo.IdCoordenadorDocente);

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
		if (u.nome.length < 3 || u.nome.length > 100)
			return "Nome inválido";

		u.idcargo = parseInt(u.idcargo as any);
		if (isNaN(u.idcargo))
			return "Cargo inválido";

		u.idequipe = parseInt(u.idequipe as any);
		if (isNaN(u.idequipe))
			return "Equipe inválida";

		u.email = (u.email || "").normalize().trim();
		if (u.email.length < 3 || u.email.length > 100)
			return "Email inválido";

		u.telefone = (u.telefone || "").normalize().trim();
		if (u.telefone.length < 3 || u.telefone.length > 20)
			return "Telefone inválido";

		u.whatsapp = (u.whatsapp || "").normalize().trim();
		if (u.whatsapp.length < 3 || u.whatsapp.length > 20)
			return "Whatsapp inválido";

		u.rede_social = (u.rede_social || "").normalize().trim();
		if (u.rede_social.length < 3 || u.rede_social.length > 100)
			return "Rede Social inválida";	

		u.curso = (u.curso || "").normalize().trim();
		if (u.curso.length < 3 || u.curso.length > 50)
			return "Curso inválido";

		u.periodo_entrada = (u.periodo_entrada || "").normalize().trim();
		if (u.periodo_entrada.length < 3 || u.periodo_entrada.length > 20)
			return "Período de entrada inválido";

		u.periodo_saida = (u.periodo_saida || "").normalize().trim();
		if (u.periodo_saida.length > 20)
			return "Período de saída inválido";

		u.semestre_entrada = parseInt(u.semestre_entrada as any);
		if (isNaN(u.semestre_entrada) || u.semestre_entrada <= 0 || u.semestre_entrada > 12)
			return "Semestre de entrada inválido";

		if (!u.semestre_saida) {
			u.semestre_saida = null;
		} else {
			u.semestre_saida = parseInt(u.semestre_saida as any);
			if (isNaN(u.semestre_saida) || u.semestre_saida < u.semestre_entrada || u.semestre_saida > 12)
				return "Semestre de saída inválido";
		}

		u.semestre_atual = parseInt(u.semestre_atual as any);
		if (isNaN(u.semestre_atual) || u.semestre_atual < u.semestre_entrada || u.semestre_atual > 12 || (u.semestre_saida && u.semestre_atual !== u.semestre_saida))
			return "Semestre atual inválido";

		if (u.periodo_saida && !u.semestre_saida)
			return "Semestre de saída é obrigatório se o período de saída for fornecido";

		if (!u.periodo_saida && u.semestre_saida)
			return "Período de saída é obrigatório se o semestre de saída for fornecido";

		return null;
	}

	public static async listar_ativo(): Promise<Usuario[]> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select u.id, u.login, u.nome, c.nome cargo, e.nome equipe, u.versao, date_format(u.criacao, '%d/%m/%Y') criacao, u.email, u.telefone, u.whatsapp, u.rede_social, u.curso, u.periodo_entrada, u.periodo_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.ativo from usuario u inner join cargo c on (c.id = u.idcargo) inner join equipe e on (e.id = u.idequipe) where u.ativo = 1 order by u.login asc") as Usuario[];
		});

		return (lista || []);
	}

	public static async listar_inativo(): Promise<Usuario[]> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select u.id, u.login, u.nome, c.nome cargo, e.nome equipe, u.versao, date_format(u.criacao, '%d/%m/%Y') criacao, u.email, u.telefone, u.whatsapp, u.rede_social, u.curso, u.periodo_entrada, u.periodo_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.ativo from usuario u inner join cargo c on (c.id = u.idcargo) inner join equipe e on (e.id = u.idequipe) where u.ativo = 0 order by u.login asc ") as Usuario[];
		});

		return (lista || []);
	}

	public static async obter(id: number): Promise<Usuario> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, login, nome, idcargo, idequipe, versao, date_format(criacao, '%d/%m/%Y') criacao, email, telefone, whatsapp, rede_social, curso, periodo_entrada, periodo_saida, semestre_entrada, semestre_saida, semestre_atual, ativo from usuario where id = ?", [id]) as Usuario[];
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
				await sql.query("insert into usuario (login, nome, idcargo, idequipe, versao, senha, criacao, email, telefone, whatsapp, rede_social, curso, periodo_entrada, periodo_saida, semestre_entrada, semestre_saida, semestre_atual, ativo) values (?, ?, ?, ?, 0, ?, now(), ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?)", [u.login, u.nome, u.idcargo, u.idequipe, appsettings.usuarioHashSenhaPadrao, u.email, u.telefone, u.whatsapp, u.rede_social, u.curso, u.periodo_entrada, u.periodo_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.ativo]);
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `O login ${u.login} já está em uso`;
							break;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Cargo ou equipe não encontrado";
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
				await sql.query("update usuario set nome = ?, idcargo = ?, idequipe = ?, email = ?, telefone=?, whatsapp=?, rede_social=?, curso=?, periodo_entrada=?, periodo_saida=?, semestre_entrada=?, semestre_saida=?, semestre_atual=?, ativo=? where id = ?", [u.nome, u.idcargo, u.idequipe, u.email, u.telefone, u.whatsapp, u.rede_social, u.curso, u.periodo_entrada, u.periodo_saida, u.semestre_entrada, u.semestre_saida, u.semestre_atual, u.ativo, u.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `O login ${u.login} já está em uso`;
							break;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Cargo ou equipe não encontrado";
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
