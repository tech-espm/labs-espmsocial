import Sql = require("../infra/sql");
import DataUtil = require("../utils/dataUtil");

export = class Consultoria{

    public id: number;
	public idorganizacao: number;
	public idorientador: number;
	public idgestor: number;
	public idconsultor: number;
	public categoria: string;
	public ano: number;
	public semestre: number;

	private static validar(c: Consultoria): string {
		c.idorganizacao = parseInt(c.idorganizacao as any);
		if (isNaN(c.idorganizacao))
			return "Organização inválida";

		c.idorientador = parseInt(c.idorientador as any);
		if (isNaN(c.idorientador))
			return "Orientador inválido";

		if (!c.idgestor) {
			c.idgestor = null;
		} else {
			c.idgestor = parseInt(c.idgestor as any);
			if (isNaN(c.idgestor) || c.idgestor < 0)
				return "Gestor inválido";
		}

		if (!c.idconsultor) {
			c.idconsultor = null;
		} else {
			c.idconsultor = parseInt(c.idconsultor as any);
			if (isNaN(c.idconsultor) || c.idconsultor < 0)
				return "Consultor inválido";
		}

		c.categoria = (c.categoria || "").normalize().trim().toLowerCase();
		if (c.categoria) {
			if (c.categoria.length > 100)
				return "Categoria inválida";
		} else {
			c.categoria = null;
		}

		if (!c.ano) {
			c.ano = null;
		} else {
			c.ano = parseInt(c.ano as any);
			if (isNaN(c.ano) || c.ano < 0)
				return "Ano inválido";
		}

		if (!c.semestre) {
			c.semestre = null;
		} else {
			c.semestre = parseInt(c.semestre as any);
			if (isNaN(c.semestre) || c.semestre < 0)
				return "Semestre inválido";
		}

		return null;
	}
	
	public static async listar(): Promise<Consultoria[]> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select c.id, o.nome organizacao, ori.nome orientador, g.nome gestor, co.nome consultor, c.categoria, c.ano, c.semestre, date_format(c.criacao, '%d/%m/%Y') criacao from consultoria c left join organizacao o on o.id = c.idorganizacao left join orientador ori on ori.id = c.idorientador left join usuario g on g.id = c.idgestor left join usuario co on co.id = c.idconsultor")) as Consultoria[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Consultoria> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = await sql.query("select id, idorganizacao, idorientador, idgestor, idconsultor, categoria, ano, semestre from consultoria where id = ?", [id]) as Consultoria[];
		});

		return ((lista && lista[0]) || null);
    }


    public static async criar(c: Consultoria): Promise<string> {
		let erro: string = Consultoria.validar(c);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("INSERT INTO consultoria (idorganizacao, idorientador, idgestor, idconsultor, categoria, ano, semestre, criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [c.idorganizacao, c.idorientador, c.idgestor, c.idconsultor, c.categoria, c.ano, c.semestre, DataUtil.hojeISOComHorario()]);
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							erro = "Organização ou orientador não encontrado";
							break;
						default:
							throw e;
					}
				} else {
					throw e;
				}
			}
		});

		return erro;
    }
    
    public static async alterar(c: Consultoria): Promise<string> {
		let erro: string = Consultoria.validar(c);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.query("update consultoria set idorganizacao = ?, idorientador = ?, idgestor = ?, idconsultor = ?, categoria = ?, ano = ?, semestre = ? where id = ?", [c.idorganizacao, c.idorientador, c.idgestor, c.idconsultor, c.categoria, c.ano, c.semestre, c.id]);
				if (!sql.linhasAfetadas)
					erro = "Consultoria não encontrada";
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							erro = "Organização ou orientador não encontrado";
							break;
						default:
							throw e;
					}
				} else {
					throw e;
				}
			}
		});

		return erro;
	}

	public static async excluir(id: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			await sql.query("delete from consultoria where id = ?", [id]);
			
			if (!sql.linhasAfetadas)
				res = "Consultoria não encontrada";
		});

		return res;
	}

}
