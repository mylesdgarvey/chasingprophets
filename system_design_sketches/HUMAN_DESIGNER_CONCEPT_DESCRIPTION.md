# Chasing Prophets

Chasing Prophets is an ecosystem and a universe that aims to provide users with an experience that allows them to gain insight not only into an entity's past but also be able to measurably and descriptively predict the entity's future.

The general model will follow the first of these types of software products. The first one is pertaining to finance. We begin simple. The object under examination: the asset.

## Core Components

Generally in any "Chasing Prophet" sub-system (such as "finance"), there comprises of:

### An Entity

This is the "thing" we are seeking to describe, explain, and predict.

### Datasets

Each individual on always describes "an entity". Sometimes that entity might be a location, place, etc. But the entity still must exist first, then the dataset. Within the dataset are measures of the entity in some way. Depending on the context of the sub-system, these datasets will likely be fixed in some way. For example, a financial subsystem would have a OHLCV data "fixed" in the sense that this data will always have 5 columns, each named open, high, low, close, and volume, respectively (and date, to be pedantic and complete that is).

### Data Slices

Describes a part of a given dataset. It can be simple (within a single time range or matching a certain criteria) or compound (union of various simple slices).

### A Model Scaffold

This is the bread and butter of the system. A model scaffold can either be context dependent of context-free. Once data is fit to it using the scaffold's learning algorithm, we get out a "Model Fit". More on that in a moment. For a single model scaffold, we have a few components to it. For example, a single scaffold would look like:

- **type**: "context-free" (context dependent or context free. if its context dependent, the variables have a certain type of meaning prescribed to them and the variables will have specific and exact names. If its context free, the variables will have generic names (like "x1", or "y1", etc).)
- **input_specification**: `[{var_1_name: "x1", var_1_type: "numerical", var_1_range: "(-inf,inf)"},{var_2_name: "x2", var_2_type: "categorical", var_2_categories: ["yes","no"]},]`
- **output_specification**: `[{out_1_name: "y1", out_1_type: "numerical", out_1_range: "[0,1]" }]`
- **model_major_category**: "econometrics"
- **model_category**: "multiple_linear_regression"
- **learning_algorithm**: "maximum_likelihood_estimation"
- **model_specification_file**: "specification.tex" (ideally i want a screen to render tex. not sure how to approach this. would like users to be able to enter latex in a management screen when adding model scaffolds. so this file would be generated and contain the exact text thrown into a text box on the interface).
- **model_training_file**: "training.py/training.js" (ideally py to be ran on lambda. however, later i will like to explore basic training on the client end. this may be a great way to use client resources to train models, then send the parameters back to the server. save on computational effort on the system's hosting end. again this code is pasted into a textbox, file created and stored and pushed to the s3 to the correct folder.
- **model_inference_file**: "inference.py/inference.js" (ideally py for batch inference that is ran daily on the server, but an inference on the client side when they pull up the info page on a single model or prophet.

### A Model Fit

Aaaa yes, the bread and butter of the system itself. This is the actual model that will be used in inference on a daily basis. It refers to the scaffold and starts there, is given a data slice, and then the train algo is ran on it. a fit results, and the fit is stored in an organized s3 folder, again according to the model itself. actions related to the fit involve train and infer, but could involve others later in the future depending on the "Chasing Prophet" sub-domain.

### Prophet

The actual bread and butter. The prophet takes one (or many) model fits on a single same training data slice (simple or compound) and uses the models to infer the next value of something about the main entity (in finance it would be like a closing price of an asset or the categorical outcome of an event like "that happened" or "that didn't happen" to a specific event like "up trend in the past 20 days" or "strong breakout", with these obviously very specifically defined. It takes output about the model and converts them to specific measured output about the entity (For example, the actual closing price, but the model fit might give a close to close return percentage predicted for that day, so hence the prophet would take the actual model fit outputs and compute the actual price, and then maybe even take the average of these). Then the prophet applies the model outputs and any transformations to them, to an additional specific transformation on the values called the "forcasting method", which indicates just how the target measure on the entity will be predicted for that time frame.

### Forecast

This is an object that is specific to an entity over a specific time horizon. The time window is fixed to the system. Typical examples would be 20 days, 60 days, 120 days, 240 days, etc. The forecast window has a start date which will only use input information prior to that start date as input into the prophet to make the next prediction. The next prediction is taken as input into the next time unit's prophet, which could be the same exact prophet, or a different one. That prophet will then spit out a predicted price for that time span. This will continue for the entire time window. A forecast can then be "judged" performance wise by looking at various measurements of error of the actual closing price path and the predicted closing price path (or, more generally, the entity's measure over time and the entity's forecasted measure over time).

### Performance Ranking

This nuance in the system will rank model fits, scaffolds, prophets, assets, and others. Asset slice data is fed into these to create prophets and forecasts, and hence they can be compared to actual pricing (so long as the actual is measured past the training date). From this information, performance measures (like, say, 20-day MAPE of the errors themselves, that is, the difference between predicted and actual, or 240-day 75th percentile of the errors, etc) are then computed and stored in the database. they are computed daily by back end lambda aws python scripts and then stored in the dynamo db. The scripts load the data and the model, make the inferences, compute the measures, and then dispose of the inferred data, only keeping the performance. This way the user can rank the different components in the system and inspect them based on those performance measures by visiting their individual pages, links of course from the main performance board.

### User Model Fit, Prophet Creation, and Forecast Design

There will be a "Social media" component to the system that permits users and admins to have a "Prophet Profile", so to speak. More on what this will entail. But each user has the ability to share other's posts, and each post is usually either an observation, general post, or specifically an "entity share", which would be to share their or other specific model fit, prophet, etc and some sort of widget or visualization of that fit, prophet, etc. Ideally, users will be scored based on their ability to construct good forecasts. Later in the system maturity, we will introduce user rewards, which means they will earn some type of "ProphetCoin", that would permit them to (1) buy skins for their prophet interface (2) buy access to special "super high performing" models, prophets, forecasts, and (3) free monthly subscription at the highest user tier. So users find good fits, predictions, forecasts, they earn coin, coin can be used for transaction on the system. The coin can be designed in a way that is tied to the prediction performance of "the system" entirely, if that makes sense, and how often the coin is being used for "ProphetTransactions". Ideally I want "ProphetCoin" to be a cryptocurrency whose inherent value is primarily backed by the models and their predictability. But this is a WAY later phase. I don't even want the social media aspect in an alpha version.

## Future Applications

As you can imagine, this structure can basically be applied to anything, not just finance. Instead of assets, we can look at "sports" and "games" for sporting event outcomes. We can apply this to random processes and games, like the lottery. Can even be applied to the weather and to bio-science with dna sequencing and genetics. Eventually, let's own the world. But to stat on alpha, we're doing one single sub-domain: finance. We'll then move to sports, and after this, well move to games of random chance (i.e. the lotto).

## System Deployment for Version 1

The system should be deployed and loaded as follows for a version 1 to be operational:

- Design out the basic functionality for the dynamodb, s3, lambda, event scheduling, cognito w/ google+microsoft auth, and react along with any other technologies that should be within the stack.

- For the dev environment, load up data for the DJIA and the SPX data series from a reliable source (this will be a script in and of itself), which will then load them into the database. An initial model scaffold, data slice, model fit, and prophet list will be provided in a text box on an admin screen and used to create initialization files. When instructed from the same screen via a button, the system will then take these files and create the corresponding objects and fits in batch. basically iit will populate the proper scaffolds first, then the slices, then the fits, and last the prophets. The system will last have an official deployment page which will permit the admin to load up a script in a box (which will later save as such on an s3) that will (1) create an inventory of assets to load into the system and run model fits and prophets on top of and (2) batch this inventory and load each one into the system or batch load somehow. (3) batch process to create the model fits and prophets for the newly added assets.