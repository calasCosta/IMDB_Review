# Sentiment Classification System for Film Reviews

## 1. About the project

This project aims to develop an automated sentiment classification system for texts, specifically applied to the field of film reviews. To this end, Text Mining and Natural Language Processing (NLP) techniques were explored and implemented in a client-server architecture that allows easy interaction through a web interface.

The system was trained and validated with a dataset composed of movie reviews, stored in a MySQL database, previously labelled as positive or negative. This corpus, balanced between the two classes, served as the basis for extracting relevant terms, calculating TF-IDF weights, and building statistical classification models.

The solution employs a combination of algorithms, **Cosine Similarity** to measure semantic proximity between text vectors and **Naive Bayes** for probabilistic evaluation, ensuring greater robustness in the decision-making process. The project is complemented by metrics such as confusion matrix, accuracy, precision, recall, and F1-score, allowing for detailed analysis of the classifier's performance.

## 2. System architecture

The system follows a traditional client-server architecture. The backend, built in **Node.js with Express**, manages all text processing and classification logic, as well as accessing a **MySQL database** where the corpus labelled with positive and negative classes is stored.

The frontend uses **EJS** to generate dynamic HTML pages, presenting the user with results such as sentiment prediction, confusion matrices, and detailed metrics.

The NLP pipeline implemented on the server applies cleaning, negation handling, stopword removal, stemming, and n-gram generation, culminating in classifications by Cosine Similarity and Naive Bayes. This modular division ensures clarity and facilitates future extensions of the project.
