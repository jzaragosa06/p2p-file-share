from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def home():
    return jsonify(message="Hello from the Flask server!")


@app.route("/greet/<name>")
def greet(name):
    return jsonify(message=f"Hello, {name}!")

if __name__ == "__main__":
    # Bind to '0.0.0.0' to make the server accessible to other devices on the local network
    app.run(host="0.0.0.0", port=5000)
