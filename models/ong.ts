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
	public causas: number[];

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

		if (!ong.causas) {
			ong.causas = [];
		} else {
			if ((typeof ong.causas) === "string" || (typeof ong.causas) === "number")
				ong.causas = [ ong.causas as any ];

			if (ong.causas.length) {
				for (let i = 0; i < ong.causas.length; i++) {
					ong.causas[i] = parseInt(ong.causas[i] as any);
					if (isNaN(ong.causas[i]))
						return "Causa inválida";
				}
			}
		}

		return null;
	}

	public static async listar(): Promise<Ong[]> { 
		let lista: Ong[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select id, nome, telefone, endereco, email, date_format(criacao, '%d/%m/%Y') criacao, ativo from ong order by nome asc")) as Ong[];
		});

		return lista || [];
	}

	public static async obter(id: number): Promise<Ong> {
		let ong: Ong = null;

		await Sql.conectar(async (sql: Sql) => {
			const lista = (await sql.query("select id, nome, telefone, endereco, email, date_format(criacao, '%d/%m/%Y') criacao, ativo from ong where id = ?", [id])) as Ong[];

			if (lista && lista[0]) {
				ong = lista[0];
				ong.causas = [];
				const causas = await sql.query("select idcausa from ong_causa where idong = ?", [id]);
				if (causas) {
					for (let i = 0; i < causas.length; i++)
						ong.causas.push(causas[i].idcausa);
				}
			}
		});

		return ong;
	}

	public static async criar(ong: Ong): Promise<string> {
		let res: string;
		if ((res = Ong.validar(ong)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.beginTransaction();

				await sql.query("insert into ong (nome, telefone, endereco, email, criacao, ativo) values (?,?,?,?,now(),?)", [ong.nome, ong.telefone, ong.endereco, ong.email, ong.ativo]);

				ong.id = await sql.scalar("select last_insert_id()") as number;

				if (ong.causas && ong.causas.length) {
					for (let i = 0; i < ong.causas.length; i++)
						await sql.query("insert into ong_causa (idong, idcausa) values (?, ?)", [ong.id, ong.causas[i]]);
				}

				await sql.commit();
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
				await sql.beginTransaction();

				await sql.query("update ong set nome = ?, telefone = ?, endereco = ?, email = ?, ativo = ?  where id = ?", [ong.nome, ong.telefone, ong.endereco, ong.email, ong.ativo, ong.id]);

				if (!sql.linhasAfetadas) {
					res = "Ong não encontrada";
					return;
				}

				await sql.query("delete from ong_causa where idong = ?", [ong.id]);

				if (ong.causas && ong.causas.length) {
					for (let i = 0; i < ong.causas.length; i++)
						await sql.query("insert into ong_causa (idong, idcausa) values (?, ?)", [ong.id, ong.causas[i]]);
				}

				await sql.commit();
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
