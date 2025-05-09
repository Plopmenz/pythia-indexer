{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    xnode-nodejs-template.url = "github:Openmesh-Network/xnode-nodejs-template";
  };

  outputs =
    {
      self,
      nixpkgs,
      xnode-nodejs-template,
      ...
    }:
    let
      system = "x86_64-linux";
    in
    {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit xnode-nodejs-template;
        };
        modules = [
          (
            { xnode-nodejs-template, ... }:
            {
              imports = [
                xnode-nodejs-template.nixosModules.default
              ];

              boot.isContainer = true;

              services.xnode-nodejs-template = {
                enable = true;
              };

              networking = {
                useHostResolvConf = nixpkgs.lib.mkForce false;
              };

              services.resolved.enable = true;

              system.stateVersion = "25.05";
            }
          )
        ];
      };
    };
}
