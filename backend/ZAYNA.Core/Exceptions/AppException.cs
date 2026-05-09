<<<<<<< HEAD
﻿namespace Zayna.Core.Exceptions
{
    public class AppException : Exception
    {
        public string Code { get; }

        public AppException(string code, string message) : base(message)
        {
            Code = code;
        }
    }
}
=======
﻿namespace Zayna.Core.Exceptions
{
    public class AppException : Exception
    {
        public string Code { get; }

        public AppException(string code, string message) : base(message)
        {
            Code = code;
        }
    }
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
