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

		r.email = (r.email || "").normalize().trim();
		if (r.email.length < 3 || r.email.length > 100)
			return "Email inválido";
			
		r.telefone = (r.telefone || "").normalize().trim();
		if (r.telefone.length < 3 || r.telefone.length > 20)
			return "Telefone inválido";
					
		r.whatsapp = (r.whatsapp || "").normalize().trim();
		if (r.whatsapp.length < 3 || r.whatsapp.length > 20)
            return "Whatsapp inválido";		
	
		return null;
	}

	public static async listar(): Promise<Representante[]> { 
		let lista: Representante[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select r.id, r.nome, r.idong, o.nome ong, r.email, r.telefone, r.whatsapp from representante r inner join ong o on o.id = r.idong order by nome asc")) as Representante[];
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
				
				if (!sql.linhasAfetadas)
					res = "Representante não encontrado";
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
			
			if (!sql.linhasAfetadas)
				res = "Representante não encontrado";
		});

		return res;
	}
};
