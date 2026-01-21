from flask import Flask, render_template, request, jsonify
from datetime import datetime
import wikipedia

app = Flask(__name__)

def shadow_brain(user_input):
    text = user_input.lower()

    if "hello" in text:
        return "Hello! I am Shadow, your virtual assistant."

    elif "your name" in text:
        return "My name is Shadow."

    elif "time" in text:
        return "The current time is " + datetime.now().strftime("%H:%M:%S")

    elif "date" in text:
        return "Today's date is " + datetime.now().strftime("%Y-%m-%d")

    # 🔹 Silent knowledge search (hidden Wikipedia)
    try:
        return wikipedia.summary(user_input, sentences=2)
    except wikipedia.exceptions.DisambiguationError:
        return "Can you please be more specific?"
    except wikipedia.exceptions.PageError:
        return "I don't have information about that yet."
    except Exception:
        return "I'm having trouble accessing knowledge right now."

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_msg = data.get("message", "")
    reply = shadow_brain(user_msg)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True, port=8080)
