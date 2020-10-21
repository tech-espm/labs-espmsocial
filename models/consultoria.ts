import Sql = require("../infra/sql");

export = class Consultoria{

    public id: number;
    public idorientador: number;
    public idong: number;
    public ano : number;

	private static validar(c: Consultoria): string {
		c.idorientador = parseInt(c.idorientador as any);
		if (isNaN(c.idorientador))
			return "Orientador inválido";

		c.idong = parseInt(c.idong as any);
		if (isNaN(c.idong))
			return "ONG inválida";

		c.ano = parseInt(c.ano as any);
		if (isNaN(c.ano) || c.ano < 0)
			return "Ano inválido";

		return null;
	}
	
	public static async listar(): Promise<Consultoria[]> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select c.id, c.ano, e.nome orientador, o.nome ong from consultoria c inner join orientador e on (c.idorientador = e.id) inner join ong o on (c.idong = o.id) order by c.ano asc")) as Consultoria[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Consultoria> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, idorientador, idong, ano from consultoria where id = ?", [id]) as Consultoria[];
		});

		return ((lista && lista[0]) || null);
    }


    public static async criar(c: Consultoria): Promise<string> {
		let erro: string = Consultoria.validar(c);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("INSERT INTO consultoria (idorientador, idong, ano) VALUES (?, ?, ?)", [c.idorientador, c.idong, c.ano]);
		});

		return erro;
    }
    
    public static async alterar(c: Consultoria): Promise<string> {
		let erro: string = Consultoria.validar(c);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("update consultoria set idorientador = ?, idong = ?, ano = ? where id = ?", [c.idorientador, c.idong, c.ano, c.id]);
			erro = sql.linhasAfetadas.toString();
		});

		return erro;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from consultoria where id = ?", [id]);
			res = sql.linhasAfetadas.toString();
		});

		return res;
	}

}
