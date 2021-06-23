import Sql = require("../infra/sql");

export = class Genero {
	public id: number;
	public nome: string;

	public static async listar(): Promise<Genero[]> {
		let lista: Genero[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from genero order by nome asc")) as Genero[];
		});

		return lista || [];
	}
};
