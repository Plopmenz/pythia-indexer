{
  config,
  pkgs,
  lib,
  ...
}:
let
  cfg = config.services.pythia-indexer;
  pythia-indexer = pkgs.callPackage ./package.nix { };
in
{
  options = {
    services.pythia-indexer = {
      enable = lib.mkEnableOption "Enable the Pythia indexer app";

      dbConnectionString = lib.mkOption {
        type = lib.types.str;
        default = "postgres://pythiabackend:pythiabackend@localhost:5432/pythia";
        example = "postgres://user:password@host:5432/database";
        description = ''
          Database to store information in.
        '';
      };

      infuraApiKey = lib.mkOption {
        type = lib.types.str;
        default = "";
        example = "<YOUR-API-KEY>";
        description = ''
          Infura API key to use for RPC calls.
        '';
      };
    };
  };

  config = lib.mkIf cfg.enable {
    users.groups.pythia-indexer = { };
    users.users.pythia-indexer = {
      isSystemUser = true;
      group = "pythia-indexer";
    };

    systemd.services.pythia-indexer = {
      wantedBy = [ "multi-user.target" ];
      description = "Populates database with information to showcase in Pythia.";
      after = [ "network.target" ];
      environment = {
        DB_CONNECTION_STRING = cfg.dbConnectionString;
        INFURA_API_KEY = cfg.infuraApiKey;
      };
      serviceConfig = {
        ExecStart = "${lib.getExe pythia-indexer}";
        User = "pythia-indexer";
        Group = "pythia-indexer";
        StateDirectory = "pythia-indexer";
        Restart = "on-failure";
      };
    };
  };
}
