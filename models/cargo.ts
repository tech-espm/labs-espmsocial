import Sql = require("../infra/sql");

export = class Cargo {
	public static readonly IdCoordenadorDocente = 0;
	public static readonly IdCoordenadorEspecial = 1;
	public static readonly IdGerente = 2;
	public static readonly IdMembro = 3;

	public id: number;
	public nome: string;

	public static async listar(): Promise<Cargo[]> {
		let lista: Cargo[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from cargo order by nome asc")) as Cargo[];
		});

		return lista || [];
	}
};
