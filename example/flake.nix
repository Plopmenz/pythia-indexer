{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    pythia-indexer = {
      url = "path:.."; # "github:OpenxAI-Network/pythia-indexer";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      pythia-indexer,
      ...
    }:
    let
      system = "x86_64-linux";
    in
    {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit pythia-indexer;
        };
        modules = [
          (
            { pythia-indexer, ... }:
            {
              imports = [
                pythia-indexer.nixosModules.default
              ];

              boot.isContainer = true;

              services.pythia-indexer = {
                enable = true;
              };

              networking = {
                firewall.allowedTCPPorts = [ 3001 ];
              };

              system.stateVersion = "25.05";
            }
          )
        ];
      };
    };
}
