import Sql = require("../infra/sql");
import DataUtil = require("../utils/dataUtil");
import emailValido = require("../utils/emailValido");

export = class Organizacao {

	public id: number;
	public nome: string;
	public idequipe_parceira: number;
	public razao_social: string;
	public sigla: string;
	public semestre_atendimento: string;
	public descricao: string;
	public observacoes: string;
	public endereco: string;
	public email: string;
	public telefone: string;
	public site: string;
	public facebook: string;
	public instagram: string;
	public ativo: number;
	public criacao: string;

	public causas: number[];

	private static validar(organizacao: Organizacao): string {
		if (!organizacao)
			return "Dados inválidos";

		organizacao.nome = (organizacao.nome || "").normalize().trim();
		if (organizacao.nome.length < 2 || organizacao.nome.length > 100)
			return "Nome inválido";

		if (!organizacao.idequipe_parceira)
			organizacao.idequipe_parceira = null;
		else if (isNaN(organizacao.idequipe_parceira = parseInt(organizacao.idequipe_parceira as any)))
			return "Equipe parceira inválida";

		organizacao.razao_social = (organizacao.razao_social || "").normalize().trim();
		if (organizacao.razao_social) {
			if (organizacao.razao_social.length > 100)
				return "Razão social inválida";
		} else {
			organizacao.razao_social = null;
		}

		organizacao.sigla = (organizacao.sigla || "").normalize().trim();
		if (organizacao.sigla) {
			if (organizacao.sigla.length > 100)
				return "Sigla inválida";
		} else {
			organizacao.sigla = null;
		}

		organizacao.semestre_atendimento = (organizacao.semestre_atendimento || "").normalize().trim();
		if (organizacao.semestre_atendimento) {
			if (organizacao.semestre_atendimento.length > 100)
				return "Semestre de atendimento inválido";
		} else {
			organizacao.semestre_atendimento = null;
		}

		organizacao.descricao = (organizacao.descricao || "").normalize().trim();
		if (organizacao.descricao) {
			if (organizacao.descricao.length > 100)
				return "Descrição inválida";
		} else {
			organizacao.descricao = null;
		}

		organizacao.observacoes = (organizacao.observacoes || "").normalize().trim();
		if (organizacao.observacoes) {
			if (organizacao.observacoes.length > 100)
				return "Observações inválidas";
		} else {
			organizacao.observacoes = null;
		}

		organizacao.endereco = (organizacao.endereco || "").normalize().trim();
		if (organizacao.endereco) {
			if (organizacao.endereco.length > 100)
				return "Endereço inválido";
		} else {
			organizacao.endereco = null;
		}

		organizacao.email = (organizacao.email || "").normalize().trim();
		if (organizacao.email) {
			if (!emailValido(organizacao.email) || organizacao.email.length > 100)
				return "E-mail inválido";
		} else {
			organizacao.email = null;
		}

		organizacao.telefone = (organizacao.telefone || "").normalize().trim();
		if (organizacao.telefone) {
			if (organizacao.telefone.length > 20)
				return "Telefone inválido";
		} else {
			organizacao.telefone = null;
		}

		organizacao.site = (organizacao.site || "").normalize().trim();
		if (organizacao.site) {
			if (organizacao.site.length > 100)
				return "Site inválido";
		} else {
			organizacao.site = null;
		}

		organizacao.facebook = (organizacao.facebook || "").normalize().trim();
		if (organizacao.facebook) {
			if (organizacao.facebook.length > 100)
				return "Facebook inválido";
		} else {
			organizacao.facebook = null;
		}

		organizacao.instagram = (organizacao.instagram || "").normalize().trim();
		if (organizacao.instagram) {
			if (organizacao.instagram.length > 100)
				return "Instagram inválido";
		} else {
			organizacao.instagram = null;
		}

		organizacao.ativo = (parseInt(organizacao.ativo as any) ? 1 : 0);

		if (!organizacao.causas) {
			organizacao.causas = [];
		} else {
			if ((typeof organizacao.causas) === "string" || (typeof organizacao.causas) === "number")
				organizacao.causas = [ organizacao.causas as any ];

			if (organizacao.causas.length) {
				for (let i = 0; i < organizacao.causas.length; i++) {
					organizacao.causas[i] = parseInt(organizacao.causas[i] as any);
					if (isNaN(organizacao.causas[i]))
						return "Causa inválida";
				}
			}
		}

		return null;
	}

	public static async listar(): Promise<Organizacao[]> {
		let lista: Organizacao[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select o.id, o.nome, e.nome equipe_parceira, o.razao_social, o.sigla, o.semestre_atendimento, o.descricao, o.observacoes, o.endereco, o.email, o.telefone, o.site, o.facebook, o.instagram, o.ativo, date_format(o.criacao, '%d/%m/%Y') criacao, (select GROUP_CONCAT(c.nome ORDER BY c.nome ASC SEPARATOR ', ') causas from organizacao_causa oc inner join causa c on c.id = oc.idcausa where oc.idorganizacao = o.id) causas from organizacao o left join equipe e on e.id = o.idequipe_parceira")) as Organizacao[];
		});

		return lista || [];
	}

	public static async listarDropDown(): Promise<Organizacao[]> {
		let lista: Organizacao[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from organizacao order by nome asc")) as Organizacao[];
		});

		return lista || [];
	}

	public static async obter(id: number): Promise<Organizacao> {
		let organizacao: Organizacao = null;

		await Sql.conectar(async (sql: Sql) => {
			const lista = (await sql.query("select id, nome, idequipe_parceira, razao_social, sigla, semestre_atendimento, descricao, observacoes, endereco, email, telefone, site, facebook, instagram, ativo from organizacao where id = ?", [id])) as Organizacao[];

			if (lista && lista[0]) {
				organizacao = lista[0];
				organizacao.causas = [];
				const causas: any[] = await sql.query("select idcausa from organizacao_causa where idorganizacao = ?", [id]);
				if (causas) {
					for (let i = 0; i < causas.length; i++)
						organizacao.causas.push(causas[i].idcausa);
				}
			}
		});

		return organizacao;
	}

	public static async criar(organizacao: Organizacao): Promise<string> {
		let res: string;
		if ((res = Organizacao.validar(organizacao)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.beginTransaction();

				await sql.query("insert into organizacao (nome, idequipe_parceira, razao_social, sigla, semestre_atendimento, descricao, observacoes, endereco, email, telefone, site, facebook, instagram, ativo, criacao) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [organizacao.nome, organizacao.idequipe_parceira, organizacao.razao_social, organizacao.sigla, organizacao.semestre_atendimento, organizacao.descricao, organizacao.observacoes, organizacao.endereco, organizacao.email, organizacao.telefone, organizacao.site, organizacao.facebook, organizacao.instagram, organizacao.ativo, DataUtil.hojeISOComHorario()]);

				organizacao.id = await sql.scalar("select last_insert_id()") as number;

				if (organizacao.causas && organizacao.causas.length) {
					for (let i = 0; i < organizacao.causas.length; i++)
						await sql.query("insert into organizacao_causa (idorganizacao, idcausa) values (?, ?)", [organizacao.id, organizacao.causas[i]]);
				}

				await sql.commit();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `A organização ${organizacao.nome} já existe`;
							return;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Causa não encontrada";
							return;
					}
				}

				throw e;
			}
		});

		return res;
	}

	public static async alterar(organizacao: Organizacao): Promise<string> {
		let res: string;
		if ((res = Organizacao.validar(organizacao)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.beginTransaction();

				await sql.query("update organizacao set nome = ?, idequipe_parceira = ?, razao_social = ?, sigla = ?, semestre_atendimento = ?, descricao = ?, observacoes = ?, endereco = ?, email = ?, telefone = ?, site = ?, facebook = ?, instagram = ?, ativo = ? where id = ?", [organizacao.nome, organizacao.idequipe_parceira, organizacao.razao_social, organizacao.sigla, organizacao.semestre_atendimento, organizacao.descricao, organizacao.observacoes, organizacao.endereco, organizacao.email, organizacao.telefone, organizacao.site, organizacao.facebook, organizacao.instagram, organizacao.ativo, organizacao.id]);

				if (!sql.linhasAfetadas) {
					res = "Organização não encontrada";
					return;
				}

				await sql.query("delete from organizacao_causa where idorganizacao = ?", [organizacao.id]);

				if (organizacao.causas && organizacao.causas.length) {
					for (let i = 0; i < organizacao.causas.length; i++)
						await sql.query("insert into organizacao_causa (idorganizacao, idcausa) values (?, ?)", [organizacao.id, organizacao.causas[i]]);
				}

				await sql.commit();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `A organização ${organizacao.nome} já existe`;
							return;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Causa não encontrada";
							return;
					}
				}

				throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("delete from organizacao where id = ?", [id]);
				if (!sql.linhasAfetadas)
					res = "Organização não encontrada";
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_ROW_IS_REFERENCED":
						case "ER_ROW_IS_REFERENCED_2":
							res = "A organização não pode ser excluída porque possui uma ou mais consultorias";
							return;
					}
				}
				throw e;
			}
		});

		return res;
	}
};
