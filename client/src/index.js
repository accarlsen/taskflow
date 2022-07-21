import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import './common.css'

import App from './app';

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, mergeArrayByField } from '@apollo/client';
console.log(process.env.REACT_APP_BACKENDHOST)
const link = createHttpLink({
  uri: process.env.REACT_APP_BACKENDHOST,
  credentials: 'include'
});

const client = new ApolloClient({
  link,
  fetchOptions: { mode: "no-cors" },
  cache: new InMemoryCache()
});

ReactDOM.render(
  
  <React.StrictMode>
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
