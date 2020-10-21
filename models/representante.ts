import Sql = require("../infra/sql");

export = class Representante {

	public id: number;
    public nome: string;
    public idong : number;
    public email: string;
    public telefone: string;
    public whatsapp: string;
 

	private static validar(r: Representante): string {
		r.nome = (r.nome || "").normalize().trim();
		if (r.nome.length < 3 || r.nome.length > 100)
            return "Nome inválido";
            
        r.idong = parseInt(r.idong as any);
		if (isNaN(r.idong))
			return "Ong inválida";    

		// email, telefone, whatsapp

		return null;
	}

	public static async listar(): Promise<Representante[]> { 
		let lista: Representante[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select r.id, r.nome, r.email, r.telefone, r.whatsapp, o.nome from representante r inner join ong o on o.id = r.idong order by r.nome asc")) as Representante[];
		});

		return lista || [];
	}

	public static async obter(id: number): Promise<Representante> {
		let lista: Representante[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome , idong, email, telefone, whatsapp from representante where id = ?", [id])) as Representante[];
		});

		return (lista && lista[0]) || null;
	}

	public static async criar(r: Representante): Promise<string> {
		let res: string;
		if ((res = Representante.validar(r)))
			return res;

		await Sql.conectar(async (sql: Sql) => { 
			try {
				await sql.query("insert into representante (nome, idong, email, telefone, whatsapp) values (?,?,?,?,?)", [r.nome, r.idong, r.email, r.telefone,r.whatsapp]);
			} catch (e) {
			if (e.code && e.code === "ER_DUP_ENTRY")
				res = `O representante ${r.nome} já existe`;
			else
				throw e;
			}
		});

		return res;
	}

	public static async alterar(r: Representante): Promise<string> {
		let res: string;
		if ((res = Representante.validar(r)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update representante set nome = ?, idong = ?, email = ?, telefone = ?, whatsapp = ? where id = ?", [r.nome,r.idong, r.email, r.telefone, r.whatsapp, r.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `O representante ${r.nome} já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from representante where id = ?", [id]);
			res = sql.linhasAfetadas.toString();
		});

		return res;
	}
};
