6.857 Final Project: Cocoon
===========================
Cocoon is a web storage application which allows users to query substring searches on their encrypted data.

Setup (Linux)
-------------
Clone the repository
```bash
git clone https://github.com/izzygomez/cocoon
cd cocoon/
```

Install String Generator
```bash
unzip StringGenerator-0.1.3.zip
cd StringGenerator-0.1.3/
sudo python setup.py install
cd ..
```

Install SuffixTree
```bash
cd suffix_tree/
sudo python setup.py install
cd ..
```

Install PyCrypto
```bash
sudo pip install pycrypto
```

Install Node modules
```bash
npm install
```

To encrypt a plaintext file
---------------------------
```bash
cd crypto
python encrypt.py -f [path-to-file]
```
The ciphertext will be saved as ``ciphertext.txt``, in the same directory that you ran ``encrypt.py`` from.

To run the server locally
-------------------------
Start MongoDB in a separate terminal window:
```bash
mkdir data
mongod --dbpath data/
```

Run the server
```bash
npm start
```

You can now use the web app at localhost:3000.
