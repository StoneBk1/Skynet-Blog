import express from 'express';
import ejs from 'ejs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import methodOverride from 'method-override';


const app = express()
const port = 3000;

let posts = [];
function formatRelativeTime(timestamp) {
    const postTime = new Date(timestamp);
    const currentTime = new Date();
    const timeDifference = currentTime - postTime;
    
    // console.log('Post Time:', postTime);
    // console.log('Current Time:', currentTime);
    // console.log('Time Difference (ms):', timeDifference);

    // Convert milliseconds to minutes
     // Convert milliseconds to minutes
     const minutes = Math.floor(timeDifference / (1000 * 60));

     if (minutes < 1) {
         return 'Just now';
     } else if (minutes === 1) {
         return '1 minute ago';
     } else if (minutes < 60) {
         return `${minutes} minutes ago`;
     } else {
         const hours = Math.floor(minutes / 60);
         if (hours === 1) {
             return '1 hour ago';
         } else {
             return `${hours} hours ago`;
         }
    }
}
app.use(methodOverride('_method'));     
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));


async function loadPostsFromFile() {
    try {
      const data = await fs.promises.readFile('posts.json', 'utf8');
      if (!data.trim()) {
        // If the file is empty, return an empty array
        return [];
    }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading posts file:', error.message);
      return [];
    }
  }
  
  async function savePostsToFile(posts) {
    try {
        await fs.promises.writeFile('posts.json', JSON.stringify(posts), 'utf8');
        console.log('Posts saved successfully.');
    } catch (error) {
        console.error('Error writing posts file:', error.message);
        throw error; // Rethrow the error to handle it in the caller function if needed
    }
}

loadPostsFromFile().then((loadedPosts) => {
    posts = loadedPosts;
    app.get('/', (req, res) => {
        res.render('index.ejs', {data: posts, formatRelativeTime: formatRelativeTime});
    })
    app.get('/newPost', (req, res) => {
        res.render('form.ejs');
    })
    app.get('/changes/:id', (req, res) => {
        const postId = req.params.id;
    const post = posts.find(post => post.id === postId);
    if (!post) {
    return res.status(404).send('Post not found');
}
    res.render('changes.ejs', { postData: post, formatRelativeTime: formatRelativeTime });
    })
    app.get('/edit/:id', (req, res) => {
        const postId = req.params.id;
    const post = posts.find(post => post.id === postId);
    res.render('edit.ejs', { postData: post, formatRelativeTime: formatRelativeTime });
    })
    app.post('/submit', (req, res) => {
        const { title, description, content } = req.body;
        const newPost = {
            id: uuidv4(),
            title: title,
            description: description,
            content: content,
            timestamp: new Date().toISOString()


        };
        console.log(newPost);
        posts.push(newPost);
        console.log(posts);
        try {
             savePostsToFile(posts);
            res.redirect('/');
        } catch (error) {
            console.error('Error saving posts to file:', error.message);
            res.status(500).send('Error saving posts to file');
        }

 })
    app.patch('/edit/:id', (req, res) => {
        const { id } = req.params;
        let titleData = req.body.title;
        let descriptionData = req.body.description;
        let contentData = req.body.content;
        const editedData = posts.find(post => post.id === id)
        editedData.title = titleData;
        editedData.description = descriptionData;
        editedData.content = contentData;
        res.redirect('/')
    })
    app.delete('/delete/:id', (req, res) => {
        const { id } = req.params;
    console.log('Deleting post with ID:', id);
    posts = posts.filter(post => post.id !== id);
    console.log('Posts after deletion:', posts);
    try {
        savePostsToFile(posts);
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting post:', error.message);
        res.status(500).send('Error deleting post');
    }
    })
    
});


app.listen(port, () => {
    console.log(`the server is running on port ${port}`)
})