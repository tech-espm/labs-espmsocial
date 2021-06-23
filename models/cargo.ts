import Sql = require("../infra/sql");

export = class Cargo {
	public static readonly IdCoordenadorDocente = 0;
	public static readonly IdGestorEquipe = 1;
	public static readonly IdCoordenadorProjetoEspecial = 2;
	public static readonly IdMembro = 3;
	public static readonly IdCargo = 4;

	public id: number;
	public nome: string;

	public static async listar(): Promise<Cargo[]> {
		let lista: Cargo[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from cargo order by id asc")) as Cargo[];
		});

		return lista || [];
	}
};
