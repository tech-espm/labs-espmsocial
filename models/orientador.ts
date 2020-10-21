import Sql = require("../infra/sql");

export = class Orientador{

    public id: number;
	public nome: string;


	private static validar(orientador: Orientador): string {
		orientador.nome = (orientador.nome || "").normalize().trim();
		if (orientador.nome.length < 3 || orientador.nome.length > 100)
			return "Nome de Orientador inválido";

		return null;
	}

	public static async listar(): Promise<Orientador[]> {
		let lista: Orientador[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from orientador order by nome asc")) as Orientador[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Orientador> {
		let lista: Orientador[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, nome from orientador where id = ?", [id]) as Orientador[];
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
				await sql.query("INSERT INTO orientador (nome) VALUES (?)", [orientador.nome]);
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					erro = `O orientador ${orientador.nome} já existe`;
				else
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
				await sql.query("update orientador set nome = ? where id = ?", [orientador.nome, orientador.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `O orientador ${orientador.nome} já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from orientador where id = ?", [id]);
			res = sql.linhasAfetadas.toString();
		});

		return res;
	}

}
