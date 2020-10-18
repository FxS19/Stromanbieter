class Data {
    constructor(app, url) {
        app.get(url, (request, response) => {
            response.send("You've requested " + url);
        });
    }
}