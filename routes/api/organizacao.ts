import express = require("express");
import wrap = require("../../infra/wrap");
import jsonRes = require("../../utils/jsonRes");
import Organizacao = require("../../models/organizacao");
import Usuario = require("../../models/usuario");

const router = express.Router();

// Se utilizar router.xxx() mas não utilizar o wrap(), as exceções ocorridas
// dentro da função async não serão tratadas!!!
router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;
	res.json(await Organizacao.listar());
}));

router.get("/obter/:id", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let organizacao = await Organizacao.obter(id);

	if (!organizacao) {
		res.status(404).json("Organização não encontrada");
	} else {
		res.json(organizacao);
	}
}));

router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;

	let organizacao = req.body as Organizacao;

	let erro = await Organizacao.criar(organizacao);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;

	let organizacao = req.body as Organizacao;

	let erro = await Organizacao.alterar(organizacao);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.get("/excluir/:id", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, false, true);
	if (!u)
		return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let erro = await Organizacao.excluir(id);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

export = router;
