import Sql = require("../infra/sql");

export = class Formacao {
	public id: number;
	public nome: string;

	public static async listar(): Promise<Formacao[]> {
		let lista: Formacao[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from formacao order by id asc")) as Formacao[];
		});

		return lista || [];
	}
};
