import express from 'express';
import mongoose from 'mongoose';
import _ from 'lodash'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

async function connectToMongo() {
    // Connect the client to the server
    await mongoose.connect('mongodb://127.0.0.1:27030/todolistDB');
    console.log("Connected successfully to server");
    
    //schema
    const itemsSchema = {
        name:{type: String, required: true}
    };

    //model
    const Item = mongoose.model("Item", itemsSchema);

    const item1 = new Item ({
        name: "Welcome to your todolist!"
    });
    const item2 = new Item ({
        name: "Hit the + button to add a new item."
    });
    const item3 = new Item ({
        name: "<-- Hit this to delete an item."
    });
    
    const defaultItems = [item1, item2, item3]

    // New list schema for dynamic route pages
    const listSchema = {
        name: String,
        items: [itemsSchema]
    };

    const List = mongoose.model('List', listSchema);

    app.get("/", (req, res)=> {
    
        Item.find({}, (err, records)=> {
            if (records.length === 0) {
                /*To insert default items*/
                Item.insertMany(defaultItems, (err, docs) => {});
                res.redirect("/");
            } else {
                res.render('list', {listTitle: "Today", listRecords: records})
            }
        });
          
    });

    // Dynamic route for accessing "http://site.page/useAnyCustomPageHere" url and generate a new list.
    app.get("/:categories", (req, res)=>  {
        const newCategory = _.capitalize(req.params.categories);
        
        List.findOne({ name: newCategory }, (err, foundList)=> {
            if(!err) {
                if(!foundList){
                    const list = new List ({
                        name: newCategory,
                        items: defaultItems
                    });
    
                    list.save();
                    res.redirect("/" + newCategory);
                     
                } else{
                    res.render('list', {listTitle: foundList.name, listRecords: foundList.items})
                }
            } 
        });
        
    });

    // Save item
    app.post("/", (req, res)=> {
        // Save input to variable
        const itemName = req.body.newRecord;
        const listName = req.body.list;

        
        const item = new Item ({
            name: itemName
        });
        // Return to home route when creation is done
        if (listName === "Today") {
            item.save();
            res.redirect("/");
        } else {
            List.findOne({ name: listName }, (err, foundList)=> {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            });
        }

    });
    // Delete a item
    app.post("/delete", (req, res)=> {

        // Save selected items and lists as variables
       const itemID = req.body.itemIdentity;
       const listName = req.body.listName


       if(listName === "Today") {

            // Run delete function on selected
            Item.deleteOne({ _id: itemID }, (err)=> {
                if(err) return handleError(err);
                else { res.redirect("/"); }
            });
       }else {
           List.findOneAndUpdate({ name:listName }, { $pull: { items: { _id:itemID } } }, (err, result)=> {
               if(!err) {
                res.redirect("/" + listName);
               }
           });

       }

    });
}

connectToMongo();

app.listen(3000, ()=> {
    console.log('Server is listening on port 3000');
});
  ////the change is on this line.////