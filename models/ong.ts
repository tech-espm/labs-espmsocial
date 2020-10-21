import Sql = require("../infra/sql");

export = class Ong {

	public id: number;
    public nome: string;
    public telefone: string;
    public endereco: string;
    public email: string;
    public criacao: string;
    public ativo: number;

	private static validar(ong: Ong): string {
		ong.nome = (ong.nome || "").normalize().trim();
		if (ong.nome.length < 3 || ong.nome.length > 100)
			return "Nome inválido";

		return null;
	}

	public static async listar(): Promise<Ong[]> { // NAO COLOQUEI O ATIVO PRA LISTAR
		let lista: Ong[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome, telefone, endereco, email, date_format(criacao, '%d/%m/%Y') criacao from ong order by nome asc")) as Ong[];
		});

		return lista || [];
	}

	public static async obter(id: number): Promise<Ong> {
		let lista: Ong[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome,telefone, endereco, email, date_format(criacao, '%d/%m/%Y') from ong where id = ?", [id])) as Ong[];
		});

		return (lista && lista[0]) || null;
	}

	public static async criar(ong: Ong): Promise<string> {
		let res: string;
		if ((res = Ong.validar(ong)))
			return res;

		await Sql.conectar(async (sql: Sql) => { //COLOCAR O CRIAÇÃO NO FINAL?? Q Q E ESSE NOW()?
			try {
				await sql.query("insert into ong (nome, telefone, endereco, email, criacao) values (?,?,?,?,now())", [ong.nome, ong.telefone, ong.endereco, ong.email]);
			} catch (e) {
			if (e.code && e.code === "ER_DUP_ENTRY")
				res = `A Ong ${ong.nome} já existe`;
			else
				throw e;
			}
		});

		return res;
	}

	public static async alterar(ong: Ong): Promise<string> {
		let res: string;
		if ((res = Ong.validar(ong)))
			return res;

		await Sql.conectar(async (sql: Sql) => { //NAO COLOQUEI A CRIAÇÃO PRA PODER ALTERAR 
			try {
				await sql.query("update ong set nome = ?, telefone = ?, endereco = ?, email = ?, ativo = ?  where id = ?", [ong.nome, ong.telefone, ong.endereco, ong.email, ong.ativo, ong.id]);
				res = sql.linhasAfetadas.toString();
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `A Ong ${ong.nome} já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from ong where id = ?", [id]);
			res = sql.linhasAfetadas.toString();
		});

		return res;
	}
};
