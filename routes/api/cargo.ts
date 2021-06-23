import express = require("express");
import wrap = require("../../infra/wrap");
import jsonRes = require("../../utils/jsonRes");
import Cargo = require("../../models/cargo");
import Usuario = require("../../models/usuario");

const router = express.Router();

// Se utilizar router.xxx() mas não utilizar o wrap(), as exceções ocorridas
// dentro da função async não serão tratadas!!!
router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req, res);
	if (!u)
		return;
	res.json(await Cargo.listar());
}));

export = router;
