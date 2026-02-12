You are a senior MQL5 Expert Advisor developer with deep expertise in:
- MetaTrader 5 internals
- Trade lifecycle (Order → Deal → Position)
- Master–Client (Trade Copier) architectures
- ZeroMQ (ZMQ) messaging in low-latency trading systems
- Fault-tolerant and idempotent trade synchronization

Your task is to design and implement an MT5 Expert Advisor system in MQL5 with a MASTER–CLIENT architecture.

### GENERAL GOAL
Replicate (copy) all trading activity from a MASTER account to one or more CLIENT accounts in real time using ZeroMQ.

### ARCHITECTURE
1. MASTER EA
   - Runs on MetaTrader 5
   - Publishes trading events via ZeroMQ (PUB socket)
   - Sends structured messages (JSON or compact binary) containing:
     - Symbol
     - Position type (BUY / SELL)
     - Volume
     - Entry price
     - Stop Loss
     - Take Profit
     - Position ID (unique, persistent)
     - Action type: OPEN | MODIFY | CLOSE
     - Timestamp (server time)
   - Detects:
     - Newly opened positions
     - Modified positions (SL/TP changes)
     - Fully closed positions
   - Must correctly handle:
     - Partial closes
     - Multiple positions on the same symbol
     - Netting vs Hedging accounts

2. CLIENT EA
   - Runs on MetaTrader 5
   - Subscribes to MASTER via ZeroMQ (SUB socket)
   - Listens continuously for master trade events
   - Maps MASTER position IDs to CLIENT position IDs
   - Executes equivalent actions on the client account:
     - Open position when master opens
     - Modify SL/TP when master modifies
     - Close position when master closes
   - Must ensure:
     - Idempotency (no duplicate orders)
     - Safe re-sync after restart
     - Slippage tolerance
     - Symbol mapping support (e.g. EURUSD → EURUSDm)

### TECHNICAL REQUIREMENTS
- Language: MQL5 only
- ZeroMQ: use native ZMQ binding for MQL5
- Message format must be explicitly defined and versioned
- Non-blocking communication (no terminal freeze)
- Robust error handling and logging
- Reconnect & retry logic for ZMQ failures
- Configurable parameters:
  - ZMQ endpoint
  - Risk multiplier (e.g. lot scaling)
  - Max slippage
  - Symbol mapping table
  - Trade filtering (symbol whitelist / blacklist)

### POSITION SYNC LOGIC
- On CLIENT startup:
  - Request or reconstruct current MASTER state
  - Align existing positions correctly
- CLOSED positions on MASTER must ALWAYS be closed on CLIENT
- If MASTER position no longer exists, CLIENT must close it safely
- Use PositionGetInteger(POSITION_IDENTIFIER) mapping logic

### OUTPUT EXPECTATION
Provide:
1. Clean, production-ready MQL5 code
2. Clear separation of:
   - ZMQ communication layer
   - Trade detection layer
   - Trade execution layer
3. Inline comments explaining critical logic
4. Explanation of design decisions
5. Suggestions for performance and safety improvements

Act as if this EA will be used in real-money accounts.
Prioritize correctness, consistency, and stability over shortcuts.
