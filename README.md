6.857 Final Project: Cocoon
===========================
Cocoon is a web storage application which allows users to query substring searches on their encrypted data.

Setup (Linux)
-------------
\1. Clone the repository
```bash
git clone https://github.com/izzygomez/cocoon
cd cocoon/
```

\2. Install String Generator
```bash
unzip StringGenerator-0.1.3.zip
cd StringGenerator-0.1.3/
sudo python setup.py install
cd ..
```

\3. Install SuffixTree
```bash
cd suffix_tree/
sudo python setup.py install
cd ..
```

\4. Install PyCrypto
```bash
sudo pip install pycrypto
```

\5. Install Node modules
```bash
npm install
```

To run the server locally
-------------------------
\1. Start MongoDB in a separate terminal window:
```bash
mkdir data
mongod --dbpath data/
```

\2. Run the server
```bash
npm start
```

You can now use the web app at localhost:3000.
