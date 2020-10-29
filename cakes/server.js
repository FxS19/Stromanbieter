function run(app, database) {
  // https://expressjs.com/en/starter/basic-routing.html
  app.get("/cakes", async (request, response) => {
    const db = await database;
    const results = await db.all("SELECT * FROM cakes");
    response.json(results);
  });

  // https://expressjs.com/en/starter/basic-routing.html
  app.get("/cakes/:id", async (request, response) => {
    const db = await database;
    const cakes = await db.all(
      "SELECT * FROM cakes WHERE id = ?",
      parseInt(request.params.id)
    );
    if (cakes[0]) {
      response.json(cakes[0]);
    } else {
      response.status(404).send({error: `Cake ${request.params.id} not found`});
    }
  });

  // https://expressjs.com/en/starter/basic-routing.html
  /*app.put("/cakes/:id", (request, response) => {
    console.log(request.params);
    let cake = cakes.find(element => element.id.toString() == request.params.id);
    if (cake == null) {
      response.status(404).send({ error: "Cake not found" });
    } else {
      if (request.body.name != null) {
        cake.name = request.body.name;
      }
      if (request.body.weight != null) {
        cake.weight = request.body.weight;
      }
      if (request.body.uom != null) {
        cake.uom = request.body.uom;
      }
      response.send(cake);
    }
  });*/

  app.post('/cakes', async (request, response) => {
    console.log(request.body);
    const db = await database;
    const created = await db.run(
      "INSERT INTO cakes (name,weight,uom) VALUES (?, ?, ?)",
      request.body.name,
      request.body.weight,
      request.body.uom
    );

    const cake = await db.get(
      "SELECT * FROM cakes WHERE id = ?",
      created.lastID
    );
    response.send(cake);
  });

  app.delete('/cakes/:id', async (request, response) => {
    console.log(request.params);
    const db = await database;
    await db.all(
      "DELETE FROM cakes WHERE id = ?",
      parseInt(request.params.id)
    );
    response.send(true);
  });
}

module.exports = run;