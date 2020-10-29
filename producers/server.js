let producers = require ("./producers");

function run(app){
  app.get('/producers' , (request, response) => {
    response.send(producers);
  });
  
  app.get('/producers/:id',  (request, response) => {
    let producer = producers.find(element => element.id.toString() == request.params.id);
    if (producer == null){
      response.status(404).send({error: `Producer ${request.params.id} not found`});
    }else{
      response.send(producer);
    }
  });
  
  app.post('/producers',  (request, response) => {
    console.log(request.body);
    try {
      const producer = {
        id: Math.max(...cakes.map(element => element.id))+1,
        name: request.body.name,
        city: request.body.city,
        employeeCount: request.body.employeeCount
      }
      producers.push(producer);
      response.json(producer);
    } catch (error) {
      response.status("400").send({error: "Wrong message"});
    }
  });
  
  app.put("/producers/:id", (request, response) => {
    console.log(request.params);
    let producer = producers.find(element => element.id.toString() == request.params.id);
    if(producer == null){
      response.status(404).send({error: "Producer not found"});
    }else{
      if (request.body.name != null){
        producer.name = request.body.name;
      }
      if (request.body.city != null){
        producer.city = request.body.city;
      }
      if (request.body.employeeCount != null){
        producer.employeeCount = request.body.employeeCount;
      }
      response.send(producer);
    }
  });
  
  app.delete('/producers/:id',  (request, response) => {
    console.log(request.params);
    const producer = producers.find(element => element.id.toString() == request.params.id);
    if (producer == null){
      response.status(404).send({error: "Producer not found"});
    }else{
      const index = producers.indexOf(producer);
      if (index === -1){
        response.status(404).send({error: "Producer not found"});
        return;
      }
      producers.splice(index, 1);
      response.send(true);
    }
  });
}

module.exports = run;