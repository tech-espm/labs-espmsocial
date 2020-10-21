import Sql = require("../infra/sql");

export = class Consultoria{

    public id: number;
    public idorientador: number;
    public idong: number;
    public ano : number;

    
	public static async listar(): Promise<Consultoria[]> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select c.id, c.ano, e.nome, o.nome from consultoria c inner join orientador e on (c.idorientador = e.id) inner join ong o on (c.idong = o.id) order by c.ano asc")) as Consultoria[];
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
            // TIRAR ESSE TRY CATCH -> nao tem que validar se ja existe ou nao

			try {
				await sql.query("INSERT INTO consultoria (idorientador, idong, ano) VALUES (?, ?, ?)", [c.idorientador, c.idong, c.ano]);
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					erro = `Consultoria ${c.ano} `;
				else
					throw e;
			}

		});

		return erro;
    }
    
    public static async alterar(c: Consultoria): Promise<string> {
		let res: string;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update consultoria set idorientador = ?, idong = ?, ano = ? where id = ?", [c.idorientador, c.idong, c.ano, c.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `A consultoria ${c.id} já existe`;
				else
					throw e;
			}
		});

		return res;
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