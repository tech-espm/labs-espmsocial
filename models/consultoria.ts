import Sql = require("../infra/sql");
import DataUtil = require("../utils/dataUtil");

export = class Consultoria{

    public id: number;
	public idorganizacao: number;
	public idorientador: number;
	public idgestor: number;
	public idconsultor: number;
	public idconsultor2: number;
	public idconsultor3: number;
	public idconsultor4: number;
	public categoria: string;
	public ano: number;
	public semestre: number;

	public causas: number[];

	private static validar(c: Consultoria): string {
		if (!c)
			return "Dados inválidos";

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
				return "Consultor 1 inválido";
		}

		if (!c.idconsultor2) {
			c.idconsultor2 = null;
		} else {
			c.idconsultor2 = parseInt(c.idconsultor2 as any);
			if (isNaN(c.idconsultor2) || c.idconsultor2 < 0)
				return "Consultor 2 inválido";
		}

		if (!c.idconsultor3) {
			c.idconsultor3 = null;
		} else {
			c.idconsultor3 = parseInt(c.idconsultor3 as any);
			if (isNaN(c.idconsultor3) || c.idconsultor3 < 0)
				return "Consultor 3 inválido";
		}

		if (!c.idconsultor4) {
			c.idconsultor4 = null;
		} else {
			c.idconsultor4 = parseInt(c.idconsultor4 as any);
			if (isNaN(c.idconsultor4) || c.idconsultor4 < 0)
				return "Consultor 4 inválido";
		}

		c.categoria = (c.categoria || "").normalize().trim().toLowerCase();
		if (c.categoria) {
			if (c.categoria.length > 100)
				return "Observações inválidas";
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

		if (!c.causas) {
			c.causas = [];
		} else {
			if ((typeof c.causas) === "string" || (typeof c.causas) === "number")
				c.causas = [ c.causas as any ];

			if (c.causas.length) {
				for (let i = 0; i < c.causas.length; i++) {
					c.causas[i] = parseInt(c.causas[i] as any);
					if (isNaN(c.causas[i]))
						return "Causa inválida";
				}
			}
		}

		return null;
	}
	
	public static async listar(): Promise<Consultoria[]> {
		let lista: Consultoria[] = null;

		await Sql.conectar(async (sql: Sql) => {
			lista = (await sql.query("select c.id, o.nome organizacao, ori.nome orientador, g.nome gestor, co.nome consultor, co2.nome consultor2, co3.nome consultor3, co4.nome consultor4, c.categoria, c.ano, c.semestre, date_format(c.criacao, '%d/%m/%Y') criacao, (select GROUP_CONCAT(ca.nome ORDER BY ca.nome ASC SEPARATOR ', ') causas from consultoria_causa cc inner join causa ca on ca.id = cc.idcausa where cc.idconsultoria = c.id) causas from consultoria c left join organizacao o on o.id = c.idorganizacao left join orientador ori on ori.id = c.idorientador left join usuario g on g.id = c.idgestor left join usuario co on co.id = c.idconsultor left join usuario co2 on co2.id = c.idconsultor2 left join usuario co3 on co3.id = c.idconsultor3 left join usuario co4 on co4.id = c.idconsultor4")) as Consultoria[];
		});

		return lista || [];
    }
    
    public static async obter(id: number): Promise<Consultoria> {
		let consultoria: Consultoria = null;

		await Sql.conectar(async (sql: Sql) => {
			const lista = (await sql.query("select id, idorganizacao, idorientador, idgestor, idconsultor, idconsultor2, idconsultor3, idconsultor4, categoria, ano, semestre from consultoria where id = ?", [id])) as Consultoria[];

			if (lista && lista[0]) {
				consultoria = lista[0];
				consultoria.causas = [];
				const causas: any[] = await sql.query("select idcausa from consultoria_causa where idconsultoria = ?", [id]);
				if (causas) {
					for (let i = 0; i < causas.length; i++)
						consultoria.causas.push(causas[i].idcausa);
				}
			}
		});

		return consultoria;
    }


    public static async criar(c: Consultoria): Promise<string> {
		let erro: string = Consultoria.validar(c);

		if (erro) {
			return erro;
		}

		await Sql.conectar(async (sql: Sql) => {
			try {
				await sql.beginTransaction();

				await sql.query("INSERT INTO consultoria (idorganizacao, idorientador, idgestor, idconsultor, idconsultor2, idconsultor3, idconsultor4, categoria, ano, semestre, criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [c.idorganizacao, c.idorientador, c.idgestor, c.idconsultor, c.idconsultor2, c.idconsultor3, c.idconsultor4, c.categoria, c.ano, c.semestre, DataUtil.hojeISOComHorario()]);

				c.id = await sql.scalar("select last_insert_id()") as number;

				if (c.causas && c.causas.length) {
					for (let i = 0; i < c.causas.length; i++)
						await sql.query("insert into consultoria_causa (idconsultoria, idcausa) values (?, ?)", [c.id, c.causas[i]]);
				}

				await sql.commit();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							erro = "Organização, orientador ou causa não encontrada";
							return;
					}
				}

				throw e;
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
				await sql.beginTransaction();

				await sql.query("update consultoria set idorganizacao = ?, idorientador = ?, idgestor = ?, idconsultor = ?, idconsultor2 = ?, idconsultor3 = ?, idconsultor4 = ?, categoria = ?, ano = ?, semestre = ? where id = ?", [c.idorganizacao, c.idorientador, c.idgestor, c.idconsultor, c.idconsultor2, c.idconsultor3, c.idconsultor4, c.categoria, c.ano, c.semestre, c.id]);

				if (!sql.linhasAfetadas) {
					erro = "Consultoria não encontrada";
					return;
				}

				await sql.query("delete from consultoria_causa where idconsultoria = ?", [c.id]);

				if (c.causas && c.causas.length) {
					for (let i = 0; i < c.causas.length; i++)
						await sql.query("insert into consultoria_causa (idconsultoria, idcausa) values (?, ?)", [c.id, c.causas[i]]);
				}

				await sql.commit();
			} catch (e) {
				if (e.code) {
					switch (e.code) {
						case "ER_NO_REFERENCED_ROW":
						case "ER_NO_REFERENCED_ROW_2":
							erro = "Organização, orientador ou causa não encontrada";
							return;
					}
				}

				throw e;
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
