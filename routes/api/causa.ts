import express = require("express");
import wrap = require("../../infra/wrap");
import jsonRes = require("../../utils/jsonRes");
import Causa = require("../../models/causa");
import Usuario = require("../../models/usuario");

const router = express.Router();

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res);
	if (!u)
		return;
	res.json(await Causa.listar());
}));

router.get("/obter/:id", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res);
	if (!u)
		return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let causa = await Causa.obter(id);

	if (!causa) {
		res.status(404).json("Causa não encontrada");
	} else {
		res.json(causa);
	}
}));

router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, true);
	if (!u)
		return;

	let causa = req.body as Causa;

	let erro = await Causa.criar(causa);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res, true);
	if (!u)
		return;

	let causa = req.body as Causa;

	let erro = await Causa.alterar(causa);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.get("/excluir/:id", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res);
	if (!u)
		return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let erro = await Causa.excluir(id);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

export = router;
