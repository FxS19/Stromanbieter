let cakes = require ("./cakes");

function run(app){
// https://expressjs.com/en/starter/basic-routing.html
app.get("/cakes", (request, response) => {
    response.json(cakes);
  });
  
  // https://expressjs.com/en/starter/basic-routing.html
  app.get("/cakes/:id", (request, response) => {
    console.log(request.params);
    let mycake = cakes.find(element => element.id == parseInt(request.params.id));
    if (mycake != null) {
      response.json(mycake);
    }else{
      response.status(404).send({error: "Not found"});
    }
  });
  
  // https://expressjs.com/en/starter/basic-routing.html
  app.put("/cakes/:id", (request, response) => {
    console.log(request.params);
    let cake = cakes.find(element => element.id.toString() == request.params.id);
    if(cake == null){
      response.status(404).send({error: "Cake not found"});
    }else{
      if (request.body.name != null){
        cake.name = request.body.name;
      }
      if (request.body.weight != null){
        cake.weight = request.body.weight;
      }
      if (request.body.uom != null){
        cake.uom = request.body.uom;
      }
      response.send(cake);
    }
  });
  
  app.post('/cakes',  (request, response) => {
      console.log(request.body);
      try {
        const cake = {
          id: Math.max(...cakes.map(element => element.id))+1,
          name: request.body.name,
          weight: request.body.weight,
          uom: request.body.uom
        }
        cakes.push(cake);
        response.json(cake);
      } catch (error) {
        response.status("400").send({error: "Wrong message"});
      }
  });
  
  app.delete('/cakes/:id',  (request, response) => {
    console.log(request.params);
    const cake = cakes.find(element => element.id.toString() == request.params.id);
    if (cake == null){
      response.status(404).send({error: "Cake not found"});
    }else{
      const index = cakes.indexOf(cake);
      if (index === -1){
        response.status(404).send({error: "Cake not found"});
        return;
      }
      cakes.splice(index, 1);
      response.send(true);
    }
  });
}

module.exports = run;