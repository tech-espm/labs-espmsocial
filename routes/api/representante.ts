import express = require("express");
import wrap = require("express-async-error-wrapper");
import jsonRes = require("../../utils/jsonRes");
import Representante = require("../../models/representante");
import Usuario = require("../../models/usuario");


const router = express.Router();

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res);
	//if (!u)
	//	return;
	res.json(await Representante.listar());
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

	let representante = await Representante.obter(id);

	if (!representante) {
		res.status(404).json("Representante não encontrado");
	} else {
		res.json(representante);
	}
}));

router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {
	//let u = await Usuario.cookie(req, res, true);
	//if (!u)
	//	return;

	let r = req.body as Representante;

	let erro = await Representante.criar(r);

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

	let r = req.body as Representante;

	let erro = await Representante.alterar(r);

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

	let erro = await Representante.excluir(id);

	if (erro) {
		res.status(400).json(erro);
	} else {
		res.sendStatus(204);
	}
}));

export = router;
