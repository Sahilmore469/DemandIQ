import urllib.request
import json

def test_url(url, data=None):
    if data:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.getcode(), resp.read()

print('Testing Backend directly:')
code, body = test_url('http://127.0.0.1:8000/api/health')
print('GET /api/health ->', code, body.decode())

code, body = test_url('http://127.0.0.1:8000/api/forecast', {'stock_code': '20725', 'model_name': 'CatBoost', 'horizon': 7})
print('POST /api/forecast (CatBoost) ->', code, 'Total predicted:', json.loads(body)['total_predicted_demand'])

print('\nTesting Vite frontend server:')
code, body = test_url('http://127.0.0.1:5173/')
print('GET http://127.0.0.1:5173/ ->', code, 'HTML length:', len(body))

print('\nTesting Vite Proxy to Backend:')
code, body = test_url('http://127.0.0.1:5173/api/health')
print('GET http://127.0.0.1:5173/api/health ->', code, body.decode())

print('\nTesting all 6 models via Vite proxy:')
models = ['CatBoost', 'XGBoost', 'Random Forest', 'Linear Regression', 'Decision Tree', 'KNN']
for m in models:
    code, body = test_url('http://127.0.0.1:5173/api/forecast', {'stock_code': '15036', 'model_name': m, 'horizon': 7})
    data = json.loads(body)
    print(f'Model {m}: {code} OK -> Daily: {data["predicted_demand"][:3]}')

print('\nALL SERVER INTEGRATION TESTS COMPLETED SUCCESSFULLY!')
