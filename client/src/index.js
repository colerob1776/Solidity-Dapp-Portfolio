import React from 'react';
import ReactDOM from 'react-dom';
import {Drizzle} from '@drizzle/store';
import { DrizzleContext } from '@drizzle/react-plugin';
import { drizzleInstance } from './drizzleOptions';
import './index.css';
import Dashboard from './App';
import * as serviceWorker from './serviceWorker';

const App = () => {

    return(
        <DrizzleContext.Provider drizzle = {drizzleInstance}>
            <DrizzleContext.Consumer>
                {drizzleContext => {
                    const {drizzle, drizzleState, initialized} = drizzleContext;

                    if(!initialized){
                        return "Loading..."
                    }

                    return(
                        <Dashboard drizzle={drizzle} drizzleState={drizzleState} />
                    )
                }}
            </DrizzleContext.Consumer>
        </DrizzleContext.Provider>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
