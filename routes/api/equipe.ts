import express = require("express");
import wrap = require("express-async-error-wrapper");
import jsonRes = require("../../utils/jsonRes");
import Equipe = require("../../models/equipe");
import Usuario = require("../../models/usuario");

const router = express.Router();

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res);
	//if (!u)
	//	return;
	res.json(await Equipe.listar());
}));

router.get("/obter/:id", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res);
	//if (!u)
	//	return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let equipe = await Equipe.obter(id);

	if (!equipe) {
		res.status(404).json("Equipe não encontrada");
	} else {
		res.json(equipe);
	}
}));

router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res, true);
	//if (!u)
	//	return;

	let equipe = req.body as Equipe;

	let erro = await Equipe.criar(equipe);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res, true);
	//if (!u)
	//	return;

	let equipe = req.body as Equipe;

	let erro = await Equipe.alterar(equipe);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

router.get("/excluir/:id", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res);
	//if (!u)
	//	return;

	let id = parseInt(req.params["id"]);

	if (isNaN(id)) {
		res.status(400).json("Id inválido");
		return;
	}

	let erro = await Equipe.excluir(id);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

export = router;
