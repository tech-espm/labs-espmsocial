import Sql = require("../infra/sql");
import emailValido = require("../utils/emailValido");

export = class Ong {

	public id: number;
    public nome: string;
    public telefone: string;
    public endereco: string;
    public email: string;
    public criacao: string;
    public ativo: number;

	private static validar(ong: Ong): string {
		if (!ong)
			return "Dados inválidos";

		ong.nome = (ong.nome || "").normalize().trim();
		if (ong.nome.length < 3 || ong.nome.length > 100)
			return "Nome inválido";

		ong.telefone = (ong.telefone || "").normalize().trim();
		if (ong.telefone.length < 3 || ong.telefone.length > 20)
			return "Telefone inválido";

		ong.endereco = (ong.endereco || "").normalize().trim();
		if (ong.endereco.length < 3 || ong.endereco.length > 100)
			return "Endereço inválido";

		ong.email = (ong.email || "").normalize().trim();
		if (ong.email.length > 100 || !emailValido(ong.email))
			return "E-mail inválido";

		ong.ativo = parseInt(ong.ativo as any);
		if (isNaN(ong.ativo) || ong.ativo < 0 || ong.ativo > 1)
			return "Status ativo inválido";

		return null;
	}

	public static async listar(): Promise<Ong[]> { // NAO COLOQUEI O ATIVO PRA LISTAR
		let lista: Ong[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome, telefone, endereco, email, date_format(criacao, '%d/%m/%Y') criacao, ativo from ong order by nome asc")) as Ong[];
		});

		return lista || [];
	}

	public static async obter(id: number): Promise<Ong> {
		let lista: Ong[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome, telefone, endereco, email, date_format(criacao, '%d/%m/%Y') criacao, ativo from ong where id = ?", [id])) as Ong[];
		});

		return (lista && lista[0]) || null;
	}

	public static async criar(ong: Ong): Promise<string> {
		let res: string;
		if ((res = Ong.validar(ong)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("insert into ong (nome, telefone, endereco, email, criacao, ativo) values (?,?,?,?,now(),?)", [ong.nome, ong.telefone, ong.endereco, ong.email, ong.ativo]);
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

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update ong set nome = ?, telefone = ?, endereco = ?, email = ?, ativo = ?  where id = ?", [ong.nome, ong.telefone, ong.endereco, ong.email, ong.ativo, ong.id]);

				if (!sql.linhasAfetadas)
					res = "Ong não encontrada";
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

			if (!sql.linhasAfetadas)
				res = "Ong não encontrada";
		});

		return res;
	}
};
