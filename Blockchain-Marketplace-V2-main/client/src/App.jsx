import 'bootstrap/dist/css/bootstrap.min.css';
import { EthProvider } from "./contexts/EthContext";
import { Marketplace } from './components';

function App() {
  return (
    <EthProvider>
      <div className='bg-light text-dark p-3'>
        <Marketplace/>
      </div>
    </EthProvider>
  );
}

export default App;
