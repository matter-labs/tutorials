type GreetingProps = {
  greeting: string;
};

const Greeting = ({ greeting }: GreetingProps) => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-center mb-4">Greeter says:</h1>
      <p className="text-2xl text-center mb-4">{greeting} 👋</p>
    </div>
  );
};

export default Greeting;
