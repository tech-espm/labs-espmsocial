import Sql = require("../infra/sql");

export = class Equipe{

    public id: number;
	public nome: string;


	public static async listar(): Promise<Equipe[]> {
		let lista: Equipe[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome from equipe order by nome asc")) as Equipe[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Equipe> {
		let lista: Equipe[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, nome from equipe where id = ?", [id]) as Equipe[];
		});

		return ((lista && lista[0]) || null);
    }
    
    private static validar(equipe: Equipe): string {
		equipe.nome = (equipe.nome || "").normalize().trim();
		if (equipe.nome.length < 2 || equipe.nome.length > 100)
			return "Nome de Equipe inválido";

		return null;
	}

    public static async criar(equipe: Equipe): Promise<string> {
		let erro: string = Equipe.validar(equipe);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {

			try {
				await sql.query("INSERT INTO equipe (nome) VALUES (?)", [equipe.nome]);
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					erro = `A equipe ${equipe.nome} já existe`;
				else
					throw e;
			}

		});

		return erro;
    }
    

    public static async alterar(equipe: Equipe): Promise<string> {
		let res: string;
		if ((res = Equipe.validar(equipe)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update equipe set nome = ? where id = ?", [equipe.nome, equipe.id]);
				
				if (!sql.linhasAfetadas)
					res = "Equipe não encontrada";
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `A equipe ${equipe.nome} já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from equipe where id = ?", [id]);
			
			if (!sql.linhasAfetadas)
				res = "Equipe não encontrada";
		});

		return res;
	}


}
