import Sql = require("../infra/sql");

export = class Causa{

    public id: number;
	public nome: string;


	public static async listar(): Promise<Causa[]> {
		let lista: Causa[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from causa order by nome asc")) as Causa[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Causa> {
		let lista: Causa[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, nome from causa where id = ?", [id]) as Causa[];
		});

		return ((lista && lista[0]) || null);
    }
    
    private static validar(causa: Causa): string {      
		causa.nome = (causa.nome || "").normalize().trim();
		if (causa.nome.length < 3 || causa.nome.length > 100)
			return "Nome de causa inválido";

		return null;
	}

    public static async criar(causa: Causa): Promise<string> {
		let erro: string = Causa.validar(causa);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {

			try {
				await sql.query("INSERT INTO causa (nome) VALUES (?)", [causa.nome]);
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					erro = `A causa ${causa.nome} já existe`;
				else
					throw e;
			}

		});

		return erro;
    }
    
    public static async alterar(causa: Causa): Promise<string> {
		let res: string;
		if ((res = Causa.validar(causa)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update causa set nome = ? where id = ?", [causa.nome, causa.id]);

				if (!sql.linhasAfetadas)
					res = "Causa não encontrada";
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `A causa ${causa.nome} já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from causa where id = ?", [id]);
			
			if (!sql.linhasAfetadas)
				res = "Causa não encontrada";
		});

		return res;
	}

}