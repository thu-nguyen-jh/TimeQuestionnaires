import { QuestionType } from "./Question.js";
import config from "../config/config.js";

const {
    ANSWER_MULTI_CLASS,
    ANSWER_CHECK_CLASS,
    ANSWER_TEXT_CLASS,
    SUBMIT_BUTTON_CLASS,
    QUESTION_CLASS,
    QUESTIONNAIRES_CLASS,
    HIDDEN_ELEMENT_CLASS,
    ACTIVE_ELEMENT_CLASS,
    FAIL_DIALOG_CLASS,
    RESULT_DIALOG_CLASS,
    RESULT_CONTAINER_CLASS
} = config

function activeElement(element) {
    element.classList.remove(HIDDEN_ELEMENT_CLASS);
    element.classList.add(ACTIVE_ELEMENT_CLASS);
}

class ShowQuestionState {
    constructor(control, question) {
        this.control = control;
        this.question = question;

        this.questionContainer = document.querySelector(QUESTIONNAIRES_CLASS);
        this.questionElement = this.questionContainer.querySelector(QUESTION_CLASS);

        this.multiChoiceElement =
            this.questionContainer.querySelector(ANSWER_MULTI_CLASS);
        this.checkboxElement =
            this.questionContainer.querySelector(ANSWER_CHECK_CLASS);
        this.textResponseElement =
            this.questionContainer.querySelector(ANSWER_TEXT_CLASS);
        this.submitButtonElement =
            this.questionContainer.querySelector(SUBMIT_BUTTON_CLASS);

        this.submitButtonElement.addEventListener("click", this.handleSubmit);
    }

    initRenderHtml() {
        this.questionContainer.style.display = "block";
        activeElement(this.submitButtonElement);
        const answerElements = [
            this.multiChoiceElement,
            this.checkboxElement,
            this.textResponseElement,
        ];
        answerElements.forEach((element) => {
            element.classList.remove(ACTIVE_ELEMENT_CLASS);
            element.classList.add(HIDDEN_ELEMENT_CLASS);
        });
        this.clearAnswerElements();
    }

    clearAnswerElements() {
        this.multiChoiceElement.innerHTML = "";
        this.checkboxElement.innerHTML = "";
        const textInput =
            this.textResponseElement.querySelector('input[type="text"]');
        if (textInput) {
            textInput.value = "";
        }
    }

    renderQuestionAndChoices() {
        this.questionElement.textContent = this.question.question;
        const renderMethods = {
            [QuestionType.MULTIPLE_CHOICE]: this.renderMultipleChoice,
            [QuestionType.TEXT_RESPONSE]: this.renderTextResponse,
            [QuestionType.CHECKBOX]: this.renderCheckbox,
        };
        renderMethods[this.question.type].call(this);
    }

    renderMultipleChoice = () => {
        activeElement(this.multiChoiceElement);
        this.question.options.forEach((option, index) => {
            const optionContainer = `
      <div class="option-container">
        <input type="radio" name="multi-choice" id="option${index}" value="${option}" />
        <label for="option${index}">${option}</label>
      </div>
    `;
            this.multiChoiceElement.insertAdjacentHTML("beforeend", optionContainer);
        });
    };

    renderCheckbox = () => {
        activeElement(this.checkboxElement);
        this.question.options.forEach((option, index) => {
            const optionContainer = `
        <div class="option-container">
          <input type="checkbox" name="checkbox" id="checkbox${index}" value="${option}" />
          <label for="checkbox${index}">${option}</label>
        </div>
      `;
            this.checkboxElement.insertAdjacentHTML("beforeend", optionContainer);
        });
    };

    renderTextResponse = () => {
        activeElement(this.textResponseElement);
        const inputElement =
            this.textResponseElement.querySelector('input[type="text"]');
        inputElement.value = "";
        inputElement.focus();
    };

    handleSubmit = () => {
        const answerMethods = {
            [QuestionType.MULTIPLE_CHOICE]: this.getSelectedRadioValue,
            [QuestionType.TEXT_RESPONSE]: this.getTextInputValue,
            [QuestionType.CHECKBOX]: this.getSelectedCheckboxValues,
        };

        const answerFunc = answerMethods[this.question.type];

        if (answerFunc) {
            if (this.isValidAnswer(answerFunc())) {
                this.selectAnswer(answerFunc());
            }
        }
    };

    isValidAnswer(answer) {
        if (
            this.question.type === QuestionType.MULTIPLE_CHOICE ||
            this.question.type === QuestionType.TEXT_RESPONSE
        ) {
            return answer !== null && answer !== undefined && answer !== "";
        } else if (this.question.type === QuestionType.CHECKBOX) {
            return Array.isArray(answer) && answer.length > 0;
        }
        return false;
    }

    getSelectedRadioValue = () => {
        const selectedRadio = this.multiChoiceElement.querySelectorAll(
            'input[type="radio"]'
        );

        const checkedRadio = Array.from(selectedRadio).find((r) => r.checked);

        return checkedRadio ?
            parseInt(checkedRadio.id.replace("option", "")) :
            null;
    };

    getSelectedCheckboxValues = () => {
        return Array.from(
            document.querySelectorAll('input[type="checkbox"]:checked')
        ).map((checkbox) => parseInt(checkbox.id.replace("checkbox", "")));
    };

    getTextInputValue = () => {
        const inputElement = document.querySelector('input[type="text"]');
        return inputElement ? inputElement.value.trim() : "";
    };

    run() {
        // If don't have render Question before, Init Render state
        this.initRenderHtml();
        this.renderQuestionAndChoices();
    }

    selectAnswer(answers) {
        checkAnswerState(
            this.control,
            this.control.getCurrentQuestion(),
            answers
        );
    }
}

function checkAnswerState(control, question, userChoice) {
    if (control.isFinishControl) {
        return;
    }
    // Check answer is true or not
    const isCorrect = question.checkAnswer(userChoice);
    const score = question.getScore(isCorrect);

    control.updateScore(score);

    // After check will run
    control.nextQuestion();
}


class EndControlState {
    constructor(control) {
        this.control = control;
        this.resultContainer = document.querySelector(RESULT_CONTAINER_CLASS);
        this.failDialog = this.resultContainer.querySelector(FAIL_DIALOG_CLASS);
        this.resultDialog = this.resultContainer.querySelector(RESULT_DIALOG_CLASS);
        this.questionnaireContainer = document.querySelector(QUESTIONNAIRES_CLASS);
    }

    renderFailDialog() {
        this.failDialog.style.display = "block";
        this.resultDialog.style.display = "none";
    }

    renderShowTotalScore() {
        const scoreElement = document.createElement("p");
        scoreElement.textContent = `Your total score: ${this.control.totalScore}`;
        this.resultDialog.appendChild(scoreElement);
        this.resultDialog.style.display = "block";
        this.failDialog.style.display = "none";
    }

    run() {
        this.questionnaireContainer.style.display = "none";
        this.resultContainer.classList.remove(HIDDEN_ELEMENT_CLASS);

        // Check condition to render Fail Dialog
        if (!this.control.isCompleteAll) {
            this.renderFailDialog();
        } else {
            this.renderShowTotalScore();
        }

        this.control.isFinishControl = true;
    }
}

export { ShowQuestionState, EndControlState };