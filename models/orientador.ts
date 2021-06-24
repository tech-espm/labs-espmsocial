import Sql = require("../infra/sql");
import DataUtil = require("../utils/dataUtil");
import emailValido = require("../utils/emailValido");

export = class Orientador{

    public id: number;
	public nome: string;
	public idformacao: number;
	public idequipe: number;
	public email: string;
	public telefone: string;
	public whatsapp: string;
	public observacoes: string;
	public criacao: string;

	private static validar(orientador: Orientador): string {
		if (!orientador)
			return "Dados inválidos";

		orientador.nome = (orientador.nome || "").normalize().trim();
		if (orientador.nome.length < 2 || orientador.nome.length > 100)
			return "Nome inválido";

		orientador.idformacao = parseInt(orientador.idformacao as any);
		if (isNaN(orientador.idformacao))
			return "Formação inválida";

		if (!orientador.idequipe)
			orientador.idequipe = null;
		else if (isNaN(orientador.idequipe = parseInt(orientador.idequipe as any)))
			return "Equipe inválida";

		orientador.email = (orientador.email || "").normalize().trim();
		if (orientador.email) {
			if (!emailValido(orientador.email) || orientador.email.length > 100)
				return "E-mail inválido";
		} else {
			orientador.email = null;
		}

		orientador.telefone = (orientador.telefone || "").normalize().trim();
		if (orientador.telefone) {
			if (orientador.telefone.length < 3 || orientador.telefone.length > 20)
				return "Telefone inválido";
		} else {
			orientador.telefone = null;
		}

		orientador.whatsapp = (orientador.whatsapp || "").normalize().trim();
		if (orientador.whatsapp) {
			if (orientador.whatsapp.length < 3 || orientador.whatsapp.length > 20)
				return "WhatsApp inválido";
		} else {
			orientador.whatsapp = null;
		}

		orientador.observacoes = (orientador.observacoes || "").normalize().trim();
		if (orientador.observacoes) {
			if (orientador.observacoes.length > 100)
				return "Observações inválidas";
		} else {
			orientador.observacoes = null;
		}

		return null;
	}

	public static async listar(): Promise<Orientador[]> {
		let lista: Orientador[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select o.id, o.nome, f.nome formacao, e.nome equipe, o.email, o.telefone, o.whatsapp, o.observacoes, date_format(o.criacao, '%d/%m/%Y') criacao from orientador o inner join formacao f on f.id = o.idformacao left join equipe e on e.id = o.idequipe")) as Orientador[];
		});

		return lista || [];
    }

	public static async listarDropDown(): Promise<Orientador[]> {
		let lista: Orientador[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from orientador order by nome asc")) as Orientador[];
		});

		return lista || [];
	}
   
    public static async obter(id: number): Promise<Orientador> {
		let lista: Orientador[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, nome, idformacao, idequipe, email, telefone, whatsapp, observacoes from orientador where id = ?", [id]) as Orientador[];
		});

		return ((lista && lista[0]) || null);
    }
    
 
    public static async criar(orientador: Orientador): Promise<string> {
		let erro: string = Orientador.validar(orientador);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {

			try {
				await sql.query("INSERT INTO orientador (nome, idformacao, idequipe, email, telefone, whatsapp, observacoes, criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [orientador.nome, orientador.idformacao, orientador.idequipe, orientador.email, orientador.telefone, orientador.whatsapp, orientador.observacoes, DataUtil.hojeISOComHorario()]);
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							erro = `O orientador ${orientador.nome} já existe`;
							return;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							erro = "Formação não encontrada";
							return;
					}
				}
				throw e;
			}

		});

		return erro;
    }
    
    public static async alterar(orientador: Orientador): Promise<string> {
		let res: string;
		if ((res = Orientador.validar(orientador)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update orientador set nome = ?, idformacao = ?, idequipe = ?, email = ?, telefone = ?, whatsapp = ?, observacoes = ? where id = ?", [orientador.nome, orientador.idformacao, orientador.idequipe, orientador.email, orientador.telefone, orientador.whatsapp, orientador.observacoes, orientador.id]);
				if (!sql.linhasAfetadas)
					res = "Orientador não encontrado";
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_DUP_ENTRY":
							res = `O orientador ${orientador.nome} já existe`;
							return;
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							res = "Formação não encontrada";
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
				await sql.query("delete from orientador where id = ?", [id]);
				if (!sql.linhasAfetadas)
					res = "Orientador não encontrado";
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_ROW_IS_REFERENCED":
						case "ER_ROW_IS_REFERENCED_2":
							res = "O orientador não pode ser excluído porque possui uma ou mais consultorias";
							return;
					}
				}
				throw e;
			}
		});

		return res;
	}

}
