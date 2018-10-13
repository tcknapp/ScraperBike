//Dependencies
//Scraping tools
var cheerio = require("cheerio");
var axios = require("axios");
//Require models
var db = require("../models");

module.exports = function (app) {

  //Get Index Page
  app.get("/", function (req, res) {
    res.redirect("/");
  });

  //---Scraping---

  // A GET route for scraping the website
  app.get("/scrape", function (req, res) {
    // Grab the body of the html with axios
    axios.get("https://www.billboard.com/news/").then(function (response) {
      // Load into cheerio and save it to '$' for a selector
      var $ = cheerio.load(response.data);

      //Grab titles within Article, h3=content-title
      $("article h3").each(function (i, element) {
        // Save an empty result object
        var result = {};

        // Add picture, title, link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        result.img = $(this)
          .children("a.href")
          .attr("data-srcset");

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function (dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function (err) {
            // If an error occurred, send it to the client
            return res.json(err);
          });
      });
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
      //redirect to home
      res.redirect("/");
    });
  });

  //---Articles---

  // Route for getting all Articles from the db
  app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
        console.log(dbArticle);
      })
      .catch(function (err) {
        res.json(err);
      })
    res.render("index", res);
  });

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function (dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function (dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

};