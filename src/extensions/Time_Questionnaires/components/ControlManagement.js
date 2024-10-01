import Timer from "./Timer.js";
import { ShowQuestionState, EndControlState } from "./ControlState.js";
import config from "../config/config.js";

const { TIMER_CLASS, MY_SCORE_CLASS } = config

class ControlManagement {
    totalScore = 0;
    currentState = null;
    currentQuestionIndex = 0;
    questions = [];
    timer = null;
    isCompleteAll = false;
    isFinishControl = false;

    constructor(time) {
        this.timer = new Timer(
            document.querySelector(TIMER_CLASS),
            time,
            this.start.bind(this),
            this.stop.bind(this)
        );
    }

    start() {
        const startState = this.getCurrentQuestionState();
        this.setState(startState);
    }

    setState(state) {
        if (this.isFinishControl) return;
        this.currentState = null;
        this.currentState = state;
        this.run();
    }

    run() {
        this.currentState.run();
    }

    addQuestion(question) {
        this.questions.push(question);
    }

    stop() {
        this.timer.forceStop();
        this.setState(new EndControlState(this));
    }

    getCurrentQuestionState() {
        return new ShowQuestionState(
            this,
            this.questions[this.currentQuestionIndex]
        );
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            const nextState = this.getCurrentQuestionState();
            this.setState(nextState);
        } else {
            // Mean that user has answered all question in legal time
            this.isCompleteAll = true;
            this.stop();
        }
    }

    updateScore(score) {
        this.totalScore += score;
        const scoreElement = document.querySelector(MY_SCORE_CLASS);
        if (scoreElement) {
            scoreElement.textContent = this.totalScore;
        } else {
            console.error("Score element not found");
        }
    }
}

export default ControlManagement;