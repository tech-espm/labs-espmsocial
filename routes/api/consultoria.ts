import express = require("express");
import wrap = require("../../infra/wrap");
import jsonRes = require("../../utils/jsonRes");
import Consultoria = require("../../models/consultoria");
import Usuario = require("../../models/usuario");

const router = express.Router();
// Se utilizar router.xxx() mas não utilizar o wrap(), as exceções ocorridas
// dentro da função async não serão tratadas!!!
router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {​​​​​
    let u = await Usuario.cookie(req, res);
    if (!u)
     return;
    res.json(await Consultoria.listar());
}​​​​​));

router.get("/obter/:id", wrap(async (req: express.Request, res: express.Response) => {​​​​​
    let u = await Usuario.cookie(req, res);
    if (!u)
     return;
    let id = parseInt(req.params["id"]);
    if (isNaN(id)) {​​​​​
        res.status(400).json("Id inválido");
        return;
    }​​​​​
    let consultoria = await Consultoria.obter(id);
    if (!consultoria) {​​​​​
        res.status(404).json("Consultoria não encontrada");
    }​​​​​ else {​​​​​
        res.json(consultoria);
    }​​​​​
}​​​​​));
router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {​​​​​
    let u = await Usuario.cookie(req, res, true);
    if (!u)
     return;
    let consultoria = req.body as Consultoria;
    let erro = await Consultoria.criar(consultoria);
    if (erro) {​​​​​
        res.status(400).json(erro);
    }​​​​​ else {​​​​​
        res.sendStatus(204);
    }​​​​​
}​​​​​));
router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {​​​​​
    let u = await Usuario.cookie(req, res, true);
    if (!u)
     return;
    let consultoria = req.body as Consultoria;
    let erro = await Consultoria.alterar(consultoria);
    if (erro) {​​​​​
        res.status(400).json(erro);
    }​​​​​ else {​​​​​
        res.sendStatus(204);
    }​​​​​
}​​​​​));
router.get("/excluir/:id", wrap(async (req: express.Request, res: express.Response) => {​​​​​
    let u = await Usuario.cookie(req, res);
    if (!u)
     return;
    let id = parseInt(req.params["id"]);
    if (isNaN(id)) {​​​​​
        res.status(400).json("Id inválido");
        return;
    }​​​​​
    let erro = await Consultoria.excluir(id);
    if (erro) {​​​​​
        res.status(400).json(erro);
    }​​​​​ else {​​​​​
        res.sendStatus(204);
    }​​​​​
}​​​​​));

export = router;