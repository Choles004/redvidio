/* Fuentes y base */
body {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: white;
}

h1, h2 {
  font-family: 'Roboto', sans-serif;
}

.container {
  padding: 20px;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  margin: 20px 0;
}

.search-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

#search {
  padding: 10px;
  width: 80%;
  max-width: 500px;
  border: 2px solid #fff;
  border-radius: 5px;
  background-color: transparent;
  color: white;
  font-size: 1rem;
}

main {
  padding: 20px;
}

#add-series-section {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 10px;
  margin-top: 30px;
}

form {
  display: flex;
  flex-direction: column;
}

form input, form textarea, form button {
  margin: 10px 0;
  padding: 10px;
  background-color: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 5px;
}

form button {
  background-color: #f39c12;
  border: none;
  cursor: pointer;
}

form button:hover {
  background-color: #e67e22;
}

.series-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.card {
  background-color: #1c1c1c;
  padding: 20px;
  border-radius: 10px;
  width: 250px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s;
}

.card:hover {
  transform: scale(1.05);
}

.card h3 {
  font-size: 1.3rem;
  color: #f39c12;
}

.card p {
  color: #aaa;
}

.card button {
  margin-top: 10px;
  background-color: #f39c12;
  color: black;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 5px;
}

.card button:hover {
  background-color: #e67e22;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: none;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #222;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

#admin-password {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

#login-btn {
  margin-top: 10px;
  background-color: #f39c12;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

#login-btn:hover {
  background-color: #e67e22;
}
