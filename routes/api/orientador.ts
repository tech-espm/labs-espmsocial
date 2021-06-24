import express = require("express");
import wrap = require("../../infra/wrap");
import jsonRes = require("../../utils/jsonRes");
import Orientador = require("../../models/orientador");
import Usuario = require("../../models/usuario");
const router = express.Router();
// Se utilizar router.xxx() mas não utilizar o wrap(), as exceções ocorridas
// dentro da função async não serão tratadas!!!
router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {​​​​​​​
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;
	res.json(await Orientador.listar());
}​​​​​​​));
router.get("/obter/:id", wrap(async (req: express.Request, res: express.Response) => {​​​​​​​
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;
	let id = parseInt(req.params["id"]);
	if (isNaN(id)) {​​​​​​​
		res.status(400).json("Id inválido");
		return;
	}​​​​​​​
	let orientador = await Orientador.obter(id);
	if (!orientador) {​​​​​​​
		res.status(404).json("Orientador não encontrado");
	}​​​​​​​ else {​​​​​​​
		res.json(orientador);
	}​​​​​​​
}​​​​​​​));
router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {​​​​​​​
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
	 return;
	let orientador = req.body as Orientador;
	let erro = await Orientador.criar(orientador);
	if (erro) {​​​​​​​
		res.status(400).json(erro);
	}​​​​​​​ else {​​​​​​​
		res.sendStatus(204);
	}​​​​​​​
}​​​​​​​));
router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {​​​​​​​
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;
	let orientador = req.body as Orientador;
	let erro = await Orientador.alterar(orientador);
	if (erro) {​​​​​​​
		res.status(400).json(erro);
	}​​​​​​​ else {​​​​​​​
		res.sendStatus(204);
	}​​​​​​​
}​​​​​​​));
router.get("/excluir/:id", wrap(async (req: express.Request, res: express.Response) => {​​​​​​​
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;
	let id = parseInt(req.params["id"]);
	if (isNaN(id)) {​​​​​​​
		res.status(400).json("Id inválido");
		return;
	}​​​​​​​
	let erro = await Orientador.excluir(id);
	if (erro) {​​​​​​​
		res.status(400).json(erro);
	}​​​​​​​ else {​​​​​​​
		res.sendStatus(204);
	}​​​​​​​
}​​​​​​​));
export = router;    