const mongoose   = require("mongoose");
const Campground = require("./models/campground");
const Comment = require("./models/comment");

let seeds = [
	{
	  name: "Cloud's Rest",
	  image: "https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg",
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus nibh libero, molestie non euismod eget, fermentum vel ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed lectus purus, imperdiet eu arcu id, gravida maximus libero. Donec finibus molestie urna, id gravida neque eleifend ac. Donec vitae scelerisque velit. Sed faucibus interdum pretium. Vestibulum ut felis id sapien imperdiet mollis vitae ac velit. Donec ac tortor vulputate, blandit leo vitae, lacinia turpis. Donec porta rhoncus justo ut lacinia. Curabitur ornare, risus sed pharetra cursus, turpis velit egestas nunc, sed molestie magna purus vel ex. Cras nulla ex, congue et eros eget, consequat varius sapien."
	},
	{
	  name: "Snow Mountain",
	  image: "https://farm6.staticflickr.com/5098/5496185186_d7d7fed22a.jpg",
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus nibh libero, molestie non euismod eget, fermentum vel ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed lectus purus, imperdiet eu arcu id, gravida maximus libero. Donec finibus molestie urna, id gravida neque eleifend ac. Donec vitae scelerisque velit. Sed faucibus interdum pretium. Vestibulum ut felis id sapien imperdiet mollis vitae ac velit. Donec ac tortor vulputate, blandit leo vitae, lacinia turpis. Donec porta rhoncus justo ut lacinia. Curabitur ornare, risus sed pharetra cursus, turpis velit egestas nunc, sed molestie magna purus vel ex. Cras nulla ex, congue et eros eget, consequat varius sapien."
	},
	{
	  name: "Japan Campround",
	  image: "https://farm9.staticflickr.com/8301/7798467848_7cdb7e980f.jpg",
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus nibh libero, molestie non euismod eget, fermentum vel ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed lectus purus, imperdiet eu arcu id, gravida maximus libero. Donec finibus molestie urna, id gravida neque eleifend ac. Donec vitae scelerisque velit. Sed faucibus interdum pretium. Vestibulum ut felis id sapien imperdiet mollis vitae ac velit. Donec ac tortor vulputate, blandit leo vitae, lacinia turpis. Donec porta rhoncus justo ut lacinia. Curabitur ornare, risus sed pharetra cursus, turpis velit egestas nunc, sed molestie magna purus vel ex. Cras nulla ex, congue et eros eget, consequat varius sapien."
	}
];

async function seedDB() {
  try {
        await Campground.remove({});
        console.log('Campgrounds removed');
        await Comment.remove({});
        console.log('Comments removed');

        for(const seed of seeds) {
            let campground = await Campground.create(seed);
            console.log('Campground created');
            let comment = await Comment.create(
                {
                    text: 'This place is great, but I wish there was internet',
                    author: 'Homer'
                }
            );
            console.log('Comment created');
            campground.comments.push(comment);
            campground.save();
            console.log('Comment added to campground');
        }
    } catch(err) {
        console.log(err);
    }
}

module.exports = seedDB;

